import test from 'node:test';
import assert from 'node:assert/strict';
import { db, generateOTP } from '../../server/db/store';
import { register, verifyEmail, resendVerificationCode } from '../../server/controllers/authController';

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

test('1. OTP Generation: generates cryptographically secure 6-digit numeric codes', () => {
  for (let i = 0; i < 25; i++) {
    const otp = generateOTP();
    assert.equal(typeof otp, 'string');
    assert.equal(otp.length, 6);
    assert.ok(/^\d{6}$/.test(otp), `OTP ${otp} must contain only 6 digits`);
    const num = parseInt(otp, 10);
    assert.ok(num >= 100000 && num <= 999999, `OTP ${otp} must be between 100000 and 999999`);
  }
});

test('2. Registration: creates unverified user with 6-digit OTP and 15-minute expiration', async () => {
  const mockReq = {
    body: {
      name: 'Alice Verification Tester',
      email: `alice.otp.${Date.now()}@du.ac.bd`,
      password: 'SecurePassword123!',
      role: 'student',
      universityId: 'univ-du',
      departmentId: 'dept-du-cse',
      studentId: 'DU-CSE-9901',
    },
  };
  const mockRes = createMockRes();

  await register(mockReq as any, mockRes as any);

  assert.equal(mockRes.statusCode, 201);
  assert.equal(mockRes.jsonData.success, true);
  assert.equal(mockRes.jsonData.requiresEmailVerification, true);
  assert.ok(mockRes.jsonData.user);
  assert.equal(mockRes.jsonData.user.isEmailVerified, false);

  const registeredUser = await db.findUserByEmail(mockReq.body.email);
  assert.ok(registeredUser);
  assert.equal(registeredUser.isEmailVerified, false);
  assert.ok(registeredUser.emailVerificationToken);
  assert.equal(registeredUser.emailVerificationToken.length, 6);
  assert.ok(registeredUser.emailVerificationExpires);

  const expiresTime = new Date(registeredUser.emailVerificationExpires).getTime();
  const diffMinutes = (expiresTime - Date.now()) / (1000 * 60);
  assert.ok(diffMinutes > 14 && diffMinutes <= 15.1, 'Expiration must be roughly 15 minutes in the future');
});

test('3. OTP Verification: valid code successfully verifies email and clears token (one-time use)', async () => {
  const email = `bob.otp.${Date.now()}@du.ac.bd`;
  const registerReq = {
    body: {
      name: 'Bob Verification',
      email,
      password: 'SecurePassword123!',
      role: 'student',
      universityId: 'univ-du',
      departmentId: 'dept-du-cse',
      studentId: 'DU-CSE-9902',
    },
  };
  const registerRes = createMockRes();
  await register(registerReq as any, registerRes as any);

  const userBefore = await db.findUserByEmail(email);
  assert.ok(userBefore);
  const validOtp = userBefore.emailVerificationToken!;
  assert.ok(validOtp);

  // Verify with valid code
  const verifyReq = {
    body: {
      email,
      code: validOtp,
    },
  };
  const verifyRes = createMockRes();
  await verifyEmail(verifyReq as any, verifyRes as any);

  assert.equal(verifyRes.statusCode, 200);
  assert.equal(verifyRes.jsonData.success, true);
  assert.equal(verifyRes.jsonData.user.isEmailVerified, true);

  // Confirm state in DB: token and expiration cleared to prevent replay
  const userAfter = await db.findUserByEmail(email);
  assert.ok(userAfter);
  assert.equal(userAfter.isEmailVerified, true);
  assert.equal(userAfter.emailVerificationToken, undefined);
  assert.equal(userAfter.emailVerificationExpires, undefined);

  // Subsequent verification with the same token should report email already verified
  const repeatRes = createMockRes();
  await verifyEmail(verifyReq as any, repeatRes as any);
  assert.equal(repeatRes.jsonData.message, 'Email is already verified.');
});

test('4. OTP Verification: rejects incorrect code with 400 status', async () => {
  const email = `carol.otp.${Date.now()}@du.ac.bd`;
  const registerReq = {
    body: {
      name: 'Carol Verification',
      email,
      password: 'SecurePassword123!',
      role: 'student',
      universityId: 'univ-du',
      departmentId: 'dept-du-cse',
      studentId: 'DU-CSE-9903',
    },
  };
  await register(registerReq as any, createMockRes() as any);

  const verifyReq = {
    body: {
      email,
      code: '000000', // incorrect code
    },
  };
  const verifyRes = createMockRes();
  await verifyEmail(verifyReq as any, verifyRes as any);

  assert.equal(verifyRes.statusCode, 400);
  assert.equal(verifyRes.jsonData.success, false);
  assert.ok(verifyRes.jsonData.error.includes('Incorrect verification code'));

  const user = await db.findUserByEmail(email);
  assert.equal(user?.isEmailVerified, false);
});

test('5. OTP Verification: rejects invalid code format (non-numeric, wrong length)', async () => {
  const email = `dave.otp.${Date.now()}@du.ac.bd`;
  const registerReq = {
    body: {
      name: 'Dave Format',
      email,
      password: 'SecurePassword123!',
      role: 'student',
      universityId: 'univ-du',
      departmentId: 'dept-du-cse',
      studentId: 'DU-CSE-9904',
    },
  };
  await register(registerReq as any, createMockRes() as any);

  const testCases = ['', '123', '12345', '1234567', 'abcdef', '12 45'];

  for (const badCode of testCases) {
    const verifyReq = {
      body: {
        email,
        code: badCode,
      },
    };
    const verifyRes = createMockRes();
    await verifyEmail(verifyReq as any, verifyRes as any);

    assert.equal(verifyRes.statusCode, 400);
    assert.equal(verifyRes.jsonData.success, false);
    assert.ok(verifyRes.jsonData.error.includes('valid 6-digit'));
  }
});

test('6. OTP Verification: rejects expired code with 400 status', async () => {
  const email = `eve.otp.${Date.now()}@du.ac.bd`;
  const registerReq = {
    body: {
      name: 'Eve Expiry',
      email,
      password: 'SecurePassword123!',
      role: 'student',
      universityId: 'univ-du',
      departmentId: 'dept-du-cse',
      studentId: 'DU-CSE-9905',
    },
  };
  await register(registerReq as any, createMockRes() as any);

  const user = await db.findUserByEmail(email);
  assert.ok(user);
  const correctCode = user.emailVerificationToken!;

  // Artificially expire the token
  await db.updateUser(user._id, {
    emailVerificationExpires: new Date(Date.now() - 60 * 1000).toISOString(),
  });

  const verifyReq = {
    body: {
      email,
      code: correctCode,
    },
  };
  const verifyRes = createMockRes();
  await verifyEmail(verifyReq as any, verifyRes as any);

  assert.equal(verifyRes.statusCode, 400);
  assert.equal(verifyRes.jsonData.success, false);
  assert.ok(verifyRes.jsonData.error.includes('expired'));

  const userStillUnverified = await db.findUserByEmail(email);
  assert.equal(userStillUnverified?.isEmailVerified, false);
});

test('7. Resend OTP: invalidates previous OTP and generates a fresh 6-digit OTP', async () => {
  const email = `frank.otp.${Date.now()}@du.ac.bd`;
  const registerReq = {
    body: {
      name: 'Frank Resend',
      email,
      password: 'SecurePassword123!',
      role: 'student',
      universityId: 'univ-du',
      departmentId: 'dept-du-cse',
      studentId: 'DU-CSE-9906',
    },
  };
  await register(registerReq as any, createMockRes() as any);

  const user = (await db.findUserByEmail(email))!;
  const originalOtp = user.emailVerificationToken!;

  // Simulate elapsed time beyond 15-second rate limit
  await db.updateUser(user._id, {
    emailVerificationExpires: new Date(Date.now() + 14 * 60 * 1000).toISOString(),
  });

  const resendReq = {
    body: {
      email,
    },
  };
  const resendRes = createMockRes();
  await resendVerificationCode(resendReq as any, resendRes as any);

  assert.equal(resendRes.statusCode, 200);
  assert.equal(resendRes.jsonData.success, true);

  const updatedUser = (await db.findUserByEmail(email))!;
  const newOtp = updatedUser.emailVerificationToken!;
  assert.notEqual(newOtp, originalOtp, 'Resend must generate a new OTP');

  // Verify that the OLD OTP is now rejected
  const oldVerifyReq = {
    body: {
      email,
      code: originalOtp,
    },
  };
  const oldVerifyRes = createMockRes();
  await verifyEmail(oldVerifyReq as any, oldVerifyRes as any);
  assert.equal(oldVerifyRes.statusCode, 400);
  assert.ok(oldVerifyRes.jsonData.error.includes('Incorrect verification code'));

  // Verify that the NEW OTP succeeds
  const newVerifyReq = {
    body: {
      email,
      code: newOtp,
    },
  };
  const newVerifyRes = createMockRes();
  await verifyEmail(newVerifyReq as any, newVerifyRes as any);
  assert.equal(newVerifyRes.statusCode, 200);
  assert.equal(newVerifyRes.jsonData.user.isEmailVerified, true);
});

test('8. Resend Rate Limiting: enforces minimum cooldown between resend requests', async () => {
  const email = `grace.otp.${Date.now()}@du.ac.bd`;
  const registerReq = {
    body: {
      name: 'Grace RateLimit',
      email,
      password: 'SecurePassword123!',
      role: 'student',
      universityId: 'univ-du',
      departmentId: 'dept-du-cse',
      studentId: 'DU-CSE-9907',
    },
  };
  await register(registerReq as any, createMockRes() as any);

  // Immediately try to resend without waiting 15 seconds
  const resendReq = {
    body: {
      email,
    },
  };
  const resendRes = createMockRes();
  await resendVerificationCode(resendReq as any, resendRes as any);

  assert.equal(resendRes.statusCode, 429);
  assert.equal(resendRes.jsonData.success, false);
  assert.ok(resendRes.jsonData.error.includes('Please wait'));
});

test('9. Production Mode Security: omits otpPreview from API responses in production', async () => {
  const originalEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';

    const email = `heidi.prod.${Date.now()}@du.ac.bd`;
    const registerReq = {
      body: {
        name: 'Heidi Production',
        email,
        password: 'SecurePassword123!',
        role: 'student',
        universityId: 'univ-du',
        departmentId: 'dept-du-cse',
        studentId: 'DU-CSE-9908',
      },
    };
    const registerRes = createMockRes();
    await register(registerReq as any, registerRes as any);

    assert.equal(registerRes.statusCode, 201);
    assert.equal(registerRes.jsonData.otpPreview, undefined, 'otpPreview must NEVER be exposed in production register response');

    // Simulate elapsed time for resend
    const user = (await db.findUserByEmail(email))!;
    await db.updateUser(user._id, {
      emailVerificationExpires: new Date(Date.now() + 14 * 60 * 1000).toISOString(),
    });

    const resendReq = { body: { email } };
    const resendRes = createMockRes();
    await resendVerificationCode(resendReq as any, resendRes as any);

    // In production without configured email provider, delivery fails gracefully with 502
    // and otpPreview must NEVER be exposed
    assert.equal(resendRes.jsonData.otpPreview, undefined, 'otpPreview must NEVER be exposed in production resend response');
    assert.equal(resendRes.jsonData.data?.otpPreview, undefined);
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

