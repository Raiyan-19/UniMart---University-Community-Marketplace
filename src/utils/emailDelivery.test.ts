import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateVerificationEmailHtml,
  sendVerificationEmail,
  getEmailProviderStatus,
} from '../../server/services/emailService';
import { register, resendVerificationCode, verifyEmail } from '../../server/controllers/authController';
import { db } from '../../server/db/store';

function createMockRes() {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.jsonData = data;
      return this;
    },
  };
  return res;
}

test('1. Email Template: generates responsive, Gmail-compatible HTML with UniMart branding and security notice', () => {
  const html = generateVerificationEmailHtml({
    to: 'student.test@du.ac.bd',
    name: 'Sarah Rahman',
    code: '789123',
    universityName: 'University of Dhaka',
  });

  // Verify UniMart branding
  assert.ok(html.includes('UniMart'), 'Must contain UniMart brand title');
  assert.ok(html.includes('University Community Marketplace'), 'Must contain marketplace tagline');
  assert.ok(html.includes('Sarah Rahman'), 'Must contain recipient name');
  assert.ok(html.includes('University of Dhaka'), 'Must contain university name');

  // Verify OTP code presence and styling
  assert.ok(html.includes('789123'), 'Must contain 6-digit OTP code');
  assert.ok(html.includes('Courier New'), 'Must format OTP in monospaced legible font');

  // Verify instructions and warnings
  assert.ok(html.includes('15 minutes'), 'Must contain 15-minute expiration notice');
  assert.ok(html.includes('Security Notice'), 'Must contain security warning');
  assert.ok(html.includes('Never share this code with anyone'), 'Must warn against sharing OTP');

  // Verify HTML escaping
  const maliciousHtml = generateVerificationEmailHtml({
    to: 'test@du.ac.bd',
    name: '<script>alert(1)</script>',
    code: '123456',
    universityName: '<b>HackUniv</b>',
  });
  assert.ok(!maliciousHtml.includes('<script>'), 'Must escape script tags');
  assert.ok(maliciousHtml.includes('&lt;script&gt;'), 'Must sanitize recipient name');
});

test('2. Email Validation: rejects invalid recipient email address without attempting provider call', async () => {
  const badEmails = ['', 'invalid-email', 'missing@domain', '@no-local.com', 'spaces in@mail.com'];

  for (const bad of badEmails) {
    const result = await sendVerificationEmail({
      to: bad,
      name: 'Bad Email Test',
      code: '654321',
    });

    assert.equal(result.success, false);
    assert.equal(result.provider, 'none');
    assert.ok(result.error?.includes('Invalid recipient email address'));
  }
});

test('3. Real Email Delivery: dispatches actual email via SMTP test account with messageId and live preview', async () => {
  const result = await sendVerificationEmail({
    to: 'verified.student@gmail.com',
    name: 'Test Student',
    code: '849201',
    universityName: 'University of Dhaka',
  });

  assert.equal(result.success, true);
  assert.ok(result.messageId, 'Must return actual messageId from delivery provider');
  assert.ok(result.messageId.length > 5);
  assert.equal(result.provider, 'ethereal');
  assert.ok(result.previewUrl?.startsWith('https://ethereal.email/message/'), 'Must provide live preview URL in test environment');
});

test('4. Registration Workflow: generates OTP and dispatches actual verification email to user', async () => {
  const email = `delivery.test.${Date.now()}@du.ac.bd`;
  const req = {
    body: {
      name: 'Delivery Integration Tester',
      email,
      password: 'SecurePassword123!',
      role: 'student',
      universityId: 'univ-du',
      departmentId: 'dept-du-cse',
      studentId: 'DU-CSE-7788',
    },
  };
  const res = createMockRes();

  await register(req as any, res as any);

  assert.equal(res.statusCode, 201);
  assert.equal(res.jsonData.success, true);
  assert.equal(res.jsonData.emailSent, true);
  assert.ok(res.jsonData.emailDeliveryProvider);
  assert.ok(res.jsonData.message.includes('dispatched'));

  const user = await db.findUserByEmail(email);
  assert.ok(user);
  assert.equal(user.isEmailVerified, false);
  assert.ok(user.emailVerificationToken);
  assert.equal(user.emailVerificationToken.length, 6);
});

test('5. Resend OTP Workflow: delivers fresh OTP email and updates user token upon successful dispatch', async () => {
  const email = `resend.delivery.${Date.now()}@du.ac.bd`;
  const regReq = {
    body: {
      name: 'Resend Tester',
      email,
      password: 'SecurePassword123!',
      role: 'student',
      universityId: 'univ-du',
      departmentId: 'dept-du-cse',
      studentId: 'DU-CSE-7799',
    },
  };
  await register(regReq as any, createMockRes() as any);

  const user = (await db.findUserByEmail(email))!;
  const originalOtp = user.emailVerificationToken!;

  // Fast forward beyond 15s rate-limit cooldown
  await db.updateUser(user._id, {
    emailVerificationExpires: new Date(Date.now() + 14 * 60 * 1000).toISOString(),
  });

  const resendReq = { body: { email } };
  const resendRes = createMockRes();
  await resendVerificationCode(resendReq as any, resendRes as any);

  assert.equal(resendRes.statusCode, 200);
  assert.equal(resendRes.jsonData.success, true);
  assert.equal(resendRes.jsonData.emailSent, true);
  assert.ok(resendRes.jsonData.emailDeliveryProvider);

  const updatedUser = (await db.findUserByEmail(email))!;
  assert.notEqual(updatedUser.emailVerificationToken, originalOtp, 'Resend must generate a new OTP');

  // Verify that the newly delivered OTP successfully verifies the account
  const verifyRes = createMockRes();
  await verifyEmail({ body: { email, code: updatedUser.emailVerificationToken } } as any, verifyRes as any);
  assert.equal(verifyRes.statusCode, 200);
  assert.equal(verifyRes.jsonData.user.isEmailVerified, true);
});

test('6. Email Provider Diagnostics: accurately reports configuration state without leaking credentials', () => {
  const status = getEmailProviderStatus();
  assert.ok(typeof status.configured === 'boolean');
  assert.ok(['resend', 'brevo', 'gmail', 'smtp', 'none'].includes(status.provider));
  assert.ok(typeof status.senderAddress === 'string');
});

test('7. Production Safety: rejects unconfigured email delivery in production environment without fake success', async () => {
  const originalEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';

    const result = await sendVerificationEmail({
      to: 'prod.candidate@du.ac.bd',
      name: 'Prod Candidate',
      code: '999111',
    });

    assert.equal(result.success, false);
    assert.equal(result.provider, 'none');
    assert.ok(result.error?.includes('No email provider configured'));
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

test('8. Provider Failure Handling: never reports successful delivery when email provider rejects request', async () => {
  const originalApiKey = process.env.RESEND_API_KEY;
  try {
    // Provide an intentionally invalid API key to trigger real provider rejection
    process.env.RESEND_API_KEY = 're_invalid_api_key_test_123456';

    const result = await sendVerificationEmail({
      to: 'failing.delivery@gmail.com',
      name: 'Failing Test',
      code: '123456',
    });

    assert.equal(result.success, false);
    assert.equal(result.provider, 'resend');
    assert.ok(result.error, 'Must report the actual provider rejection error');
  } finally {
    process.env.RESEND_API_KEY = originalApiKey;
  }
});

