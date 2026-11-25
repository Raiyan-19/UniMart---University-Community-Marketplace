import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../server/db/store';
import { getMyListings, createProduct } from '../../server/controllers/productController';

function createMockReqRes(user?: any, query: any = {}, body: any = {}) {
  let statusCode = 200;
  let responseData: any = null;

  const req = {
    user,
    query,
    body,
    params: {},
  } as any;

  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      responseData = data;
      return res;
    },
  } as any;

  return {
    req,
    res,
    getStatus: () => statusCode,
    getData: () => responseData,
  };
}

test('1. Unauthenticated users cannot access getMyListings', async () => {
  const { req, res, getStatus, getData } = createMockReqRes(undefined);
  await getMyListings(req, res);

  assert.equal(getStatus(), 401);
  assert.equal(getData().success, false);
  assert.equal(getData().error, 'Unauthorized.');
});

test('2. Multi-user listings retrieval: Raiyan gets his own listings with correct counts and stats', async () => {
  const raiyan = await db.findUserById('user-raiyan');
  assert.ok(raiyan, 'user-raiyan must exist in database');

  const { req, res, getData } = createMockReqRes(raiyan);
  await getMyListings(req, res);

  const data = getData();
  assert.equal(data.success, true);
  assert.ok(data.data.products, 'data.products must exist');
  assert.ok(data.data.stats, 'data.stats must exist');

  const raiyanExpectedProducts = (await db.getAllProducts()).filter((p) => p.sellerId === 'user-raiyan');
  assert.equal(data.data.products.length, raiyanExpectedProducts.length);
  assert.equal(data.data.stats.total, raiyanExpectedProducts.length);

  for (const product of data.data.products) {
    assert.equal(product.sellerId, 'user-raiyan');
  }

  const expectedActive = raiyanExpectedProducts.filter((p) => p.status === 'active').length;
  const expectedSold = raiyanExpectedProducts.filter((p) => p.status === 'sold').length;
  const expectedInactive = raiyanExpectedProducts.filter((p) => p.status === 'inactive').length;
  const expectedViews = raiyanExpectedProducts.reduce((sum, p) => sum + (p.views || 0), 0);

  assert.equal(data.data.stats.active, expectedActive);
  assert.equal(data.data.stats.sold, expectedSold);
  assert.equal(data.data.stats.inactive, expectedInactive);
  assert.equal(data.data.stats.totalViews, expectedViews);
});

test('3. Multi-user listings retrieval: Dr. Amin gets only his own listings with complete isolation', async () => {
  const teacher = await db.findUserById('user-teacher-amin');
  assert.ok(teacher, 'user-teacher-amin must exist');

  const { req, res, getData } = createMockReqRes(teacher);
  await getMyListings(req, res);

  const data = getData();
  assert.equal(data.success, true);

  const teacherExpectedProducts = (await db.getAllProducts()).filter((p) => p.sellerId === 'user-teacher-amin');
  assert.equal(data.data.products.length, teacherExpectedProducts.length);
  assert.equal(data.data.stats.total, teacherExpectedProducts.length);

  for (const product of data.data.products) {
    assert.equal(product.sellerId, 'user-teacher-amin');
    assert.notEqual(product.sellerId, 'user-raiyan');
  }
});

test('4. Status filtering works correctly across tabs (all, active, sold, inactive)', async () => {
  const raiyan = await db.findUserById('user-raiyan');
  assert.ok(raiyan);

  const { req: reqActive, res: resActive, getData: getDataActive } = createMockReqRes(raiyan, { status: 'active' });
  await getMyListings(reqActive, resActive);
  const activeResult = getDataActive();
  assert.ok(activeResult.data.products.every((p: any) => p.status === 'active'));
  assert.equal(activeResult.data.stats.total, activeResult.data.stats.active + activeResult.data.stats.sold + activeResult.data.stats.inactive);

  const { req: reqSold, res: resSold, getData: getDataSold } = createMockReqRes(raiyan, { status: 'sold' });
  await getMyListings(reqSold, resSold);
  const soldResult = getDataSold();
  assert.ok(soldResult.data.products.every((p: any) => p.status === 'sold'));
  assert.equal(soldResult.data.products.length, activeResult.data.stats.sold);

  const { req: reqInactive, res: resInactive, getData: getDataInactive } = createMockReqRes(raiyan, { status: 'inactive' });
  await getMyListings(reqInactive, resInactive);
  const inactiveResult = getDataInactive();
  assert.ok(inactiveResult.data.products.every((p: any) => p.status === 'inactive'));
  assert.equal(inactiveResult.data.products.length, activeResult.data.stats.inactive);
});

test('5. Newly created listings appear immediately in My Listings for newly registered user', async () => {
  const newUserId = `user-test-${Date.now()}`;
  const newUser = {
    _id: newUserId,
    name: 'New Test User',
    email: `test-${Date.now()}@baust.edu.bd`,
    passwordHash: 'hash',
    salt: 'salt',
    role: 'student' as const,
    universityId: 'univ-baust',
    departmentId: 'dept-baust-cse',
    phone: '+880 1700000000',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
    bio: 'Test student',
    isEmailVerified: true,
    isVerified: true,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db.createUser(newUser);

  const { req: reqInit, res: resInit, getData: getDataInit } = createMockReqRes(newUser);
  await getMyListings(reqInit, resInit);
  assert.equal(getDataInit().data.products.length, 0);
  assert.equal(getDataInit().data.stats.total, 0);

  const { req: reqCreate, res: resCreate, getStatus: getCreateStatus } = createMockReqRes(
    newUser,
    {},
    {
      title: 'Microcontroller Kit for CSE310',
      description: 'Used for one semester lab, perfect condition with sensors.',
      category: 'Electronics',
      price: 1500,
      condition: 'Like New',
      location: 'BAUST Campus',
    }
  );
  await createProduct(reqCreate, resCreate);
  assert.equal(getCreateStatus(), 201);

  const { req: reqAfter, res: resAfter, getData: getDataAfter } = createMockReqRes(newUser);
  await getMyListings(reqAfter, resAfter);
  const afterData = getDataAfter();
  assert.equal(afterData.data.products.length, 1);
  assert.equal(afterData.data.products[0].title, 'Microcontroller Kit for CSE310');
  assert.equal(afterData.data.products[0].sellerId, newUserId);
  assert.equal(afterData.data.stats.total, 1);
  assert.equal(afterData.data.stats.active, 1);
});
