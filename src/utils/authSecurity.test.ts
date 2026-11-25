import test from 'node:test';
import assert from 'node:assert/strict';
import { isProtectedRoute } from './routing';
import { signAuthToken, authenticate, requireRole } from '../../server/middleware/authMiddleware';
import { logout } from '../../server/controllers/authController';
import { getConversationMessages, sendMessage } from '../../server/controllers/chatController';
import { getMyListings } from '../../server/controllers/productController';
import { getProfile } from '../../server/controllers/userController';
import { db } from '../../server/db/store';

test('1. Protected Route identification: all private dashboard routes are protected', () => {
  assert.equal(isProtectedRoute('messages'), true);
  assert.equal(isProtectedRoute('my-listings'), true);
  assert.equal(isProtectedRoute('saved'), true);
  assert.equal(isProtectedRoute('settings'), true);
  assert.equal(isProtectedRoute('profile'), true);
  assert.equal(isProtectedRoute('admin'), true);

  assert.equal(isProtectedRoute('home'), false);
  assert.equal(isProtectedRoute('browse'), false);
  assert.equal(isProtectedRoute('services'), false);
  assert.equal(isProtectedRoute('graduating-sale'), false);
  assert.equal(isProtectedRoute('help'), false);
  assert.equal(isProtectedRoute('guides'), false);
});

test('2. Backend API authentication: rejects requests without valid JWT token', async () => {
  let authErrorStatus = 0;
  let authErrorJson: any = null;

  const mockRes = {
    status: (s: number) => {
      authErrorStatus = s;
      return { json: (j: any) => (authErrorJson = j) };
    },
  };

  // No authorization header
  let nextCalled = false;
  await authenticate(
    { headers: {} } as any,
    mockRes as any,
    () => { nextCalled = true; }
  );
  assert.equal(nextCalled, false);
  assert.equal(authErrorStatus, 401);
  assert.ok(authErrorJson.error?.includes('Authentication required'));

  // Forged x-user-id header without Bearer JWT
  authErrorStatus = 0;
  authErrorJson = null;
  nextCalled = false;
  await authenticate(
    { headers: { 'x-user-id': 'user-admin' } } as any,
    mockRes as any,
    () => { nextCalled = true; }
  );
  assert.equal(nextCalled, false);
  assert.equal(authErrorStatus, 401);

  // Invalid / tampered JWT
  authErrorStatus = 0;
  authErrorJson = null;
  nextCalled = false;
  await authenticate(
    { headers: { authorization: 'Bearer invalid-expired-token-12345' } } as any,
    mockRes as any,
    () => { nextCalled = true; }
  );
  assert.equal(nextCalled, false);
  assert.equal(authErrorStatus, 401);
});

test('3. Backend API authentication: rejects unauthenticated access to private controllers', async () => {
  let resStatus = 0;
  let resJson: any = null;
  await getMyListings(
    { user: undefined } as any,
    { status: (s: number) => { resStatus = s; return { json: (j: any) => (resJson = j) }; } } as any
  );
  assert.equal(resStatus, 401);
  assert.equal(resJson.success, false);

  resStatus = 0;
  resJson = null;
  await getProfile(
    { user: undefined } as any,
    { status: (s: number) => { resStatus = s; return { json: (j: any) => (resJson = j) }; } } as any
  );
  assert.equal(resStatus, 401);
  assert.equal(resJson.success, false);
});

test('4. Cross-user message access: users cannot access other users conversations', async () => {
  const convId = `conv-sec-test-${Date.now()}`;
  await db.createConversation({
    _id: convId,
    productId: 'prod-1',
    participantIds: ['user-raiyan', 'user-tanvir'],
    lastMessage: 'Private negotiation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const userC = (await db.findUserById('user-teacher-amin')) || { _id: 'user-intruder', role: 'student' as const };
  let statusGot = 0;
  let jsonGot: any = null;

  await getConversationMessages(
    { user: userC, params: { id: convId } } as any,
    { status: (s: number) => { statusGot = s; return { json: (j: any) => (jsonGot = j) }; } } as any
  );
  assert.equal(statusGot, 404);
  assert.ok(jsonGot.error?.includes('not found'));

  statusGot = 0;
  jsonGot = null;
  await sendMessage(
    { user: userC, params: { id: convId }, body: { text: 'Intruder message' } } as any,
    { status: (s: number) => { statusGot = s; return { json: (j: any) => (jsonGot = j) }; } } as any
  );
  assert.equal(statusGot, 404);
});

test('5. Stateless JWT Sign & Logout Endpoint', async () => {
  const userId = 'user-raiyan';
  const testToken = signAuthToken(userId, 'student');

  let nextCalled = false;
  const authReq: any = { headers: { authorization: `Bearer ${testToken}` } };
  await authenticate(authReq, {} as any, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(authReq.user?._id, userId);

  let logoutJson: any = null;
  await logout(
    { headers: { authorization: `Bearer ${testToken}` } } as any,
    { json: (j: any) => (logoutJson = j) } as any
  );
  assert.equal(logoutJson.success, true);
});

test('6. Role-Based Access Control: non-admins cannot access admin endpoints', () => {
  const studentUser: any = { _id: 'user-student', role: 'student' };
  const adminUser: any = { _id: 'user-admin', role: 'admin' };

  const adminGuard = requireRole('admin');

  let statusStudent = 0;
  let studentNext = false;
  adminGuard(
    { user: studentUser } as any,
    { status: (s: number) => { statusStudent = s; return { json: () => {} }; } } as any,
    () => { studentNext = true; }
  );
  assert.equal(studentNext, false);
  assert.equal(statusStudent, 403);

  let adminNext = false;
  adminGuard(
    { user: adminUser } as any,
    {} as any,
    () => { adminNext = true; }
  );
  assert.equal(adminNext, true);
});

test('7. Login JWT restores authorized access', async () => {
  const user = await db.findUserById('user-raiyan');
  assert.ok(user);

  const freshToken = signAuthToken(user._id, user.role);

  let nextInvoked = false;
  const reqObj: any = { headers: { authorization: `Bearer ${freshToken}` } };
  await authenticate(reqObj, {} as any, () => { nextInvoked = true; });

  assert.equal(nextInvoked, true);
  assert.equal(reqObj.user?._id, user._id);
});
