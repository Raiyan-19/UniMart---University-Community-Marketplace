import { Request, Response } from 'express';
import { db, hashPassword, verifyPassword, generateToken, generateOTP } from '../db/store';
import { signAuthToken } from '../middleware/authMiddleware';
import { validateRegistration, isUniversityEmail } from '../../src/utils/validation';
import { IUserDocument } from '../db/schema';
import { User } from '../../src/types';
import { sendVerificationEmail, getEmailProviderStatus } from '../services/emailService';

// Helper to format IUserDocument into client-safe User entity
export async function formatUserResponse(doc: IUserDocument): Promise<User> {
  const [univ, dept] = await Promise.all([
    db.findUniversityById(doc.universityId),
    db.findDepartmentById(doc.departmentId),
  ]);

  return {
    id: doc._id,
    name: doc.name,
    email: doc.email,
    role: doc.role,
    universityId: doc.universityId,
    universityName: univ?.name,
    universityShortName: univ?.shortName,
    departmentId: doc.departmentId,
    departmentName: dept?.name,
    phone: doc.phone,
    avatar: doc.avatar,
    bio: doc.bio,
    studentId: doc.studentId,
    designation: doc.designation,
    currentSemester: doc.currentSemester,
    isEmailVerified: doc.isEmailVerified,
    isVerified: doc.isVerified,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateRegistration(req.body);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      });
      return;
    }

    const {
      name,
      email,
      password,
      role,
      universityId,
      departmentId,
      phone,
      studentId,
      designation,
      currentSemester,
    } = req.body;

    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in instead.',
      });
      return;
    }

    const [univ, dept] = await Promise.all([
      db.findUniversityById(universityId),
      db.findDepartmentById(departmentId),
    ]);

    if (!univ) {
      res.status(400).json({
        success: false,
        error: 'The selected university is not supported or not found.',
      });
      return;
    }

    if (!dept) {
      res.status(400).json({
        success: false,
        error: 'The selected department was not found.',
      });
      return;
    }

    if (!isUniversityEmail(email, univ.domain)) {
      res.status(400).json({
        success: false,
        error: `Registration for ${univ.shortName} requires an official university email ending with @${univ.domain}.`,
      });
      return;
    }

    const { hash, salt } = hashPassword(password);
    const newUserId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const token = signAuthToken(newUserId, role);

    const newUserDoc: IUserDocument = {
      _id: newUserId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hash,
      salt,
      role,
      universityId,
      departmentId,
      phone: phone || '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
      bio: role === 'student' ? `${dept.code} student at ${univ.shortName}.` : `${designation || 'Faculty'} at ${univ.shortName}.`,
      studentId: role === 'student' ? studentId : undefined,
      designation: role === 'teacher' ? designation : undefined,
      currentSemester: currentSemester || (role === 'student' ? '1st Year, 1st Semester' : undefined),
      isEmailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined,
      isVerified: false,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createdUser = await db.createUser(newUserDoc);

    await db.createNotification({
      _id: `notif-${Date.now()}`,
      userId: newUserId,
      type: 'system',
      title: 'Welcome to UniMart!',
      message: `Welcome to the ${univ.shortName} community! Start buying, selling, and connecting on campus.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    const formattedUser = await formatUserResponse(createdUser);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to UniMart.',
      user: formattedUser,
      data: { user: formattedUser },
      token,
      requiresEmailVerification: false,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred during registration. Please try again.',
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required.',
      });
      return;
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
      return;
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({
        success: false,
        error: 'Your account has been suspended by an administrator.',
      });
      return;
    }

    const token = signAuthToken(user._id, user.role, Boolean(rememberMe));
    const formattedUser = await formatUserResponse(user);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      user: formattedUser,
      token,
      requiresEmailVerification: false,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred during login.',
    });
  }
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { code, userId: reqUserId, email: reqEmail } = req.body;
    let user = req.user;

    if (!user && reqUserId) {
      user = await db.findUserById(reqUserId);
    }
    if (!user && reqEmail) {
      user = await db.findUserByEmail(reqEmail);
    }

    if (!user) {
      res.status(404).json({ success: false, error: 'User account not found.' });
      return;
    }

    if (user.isEmailVerified) {
      const formatted = await formatUserResponse(user);
      const sessionToken = signAuthToken(user._id, user.role);
      res.json({
        success: true,
        message: 'Email is already verified.',
        user: formatted,
        data: { user: formatted },
        token: sessionToken,
      });
      return;
    }

    if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code.trim())) {
      res.status(400).json({
        success: false,
        error: 'Please enter a valid 6-digit verification code.',
      });
      return;
    }

    const cleanCode = code.trim();

    if (user.emailVerificationExpires) {
      const expiresAt = new Date(user.emailVerificationExpires).getTime();
      if (Date.now() > expiresAt) {
        res.status(400).json({
          success: false,
          error: 'Verification code has expired. Please click Resend Code to receive a new one.',
        });
        return;
      }
    }

    if (!user.emailVerificationToken || user.emailVerificationToken !== cleanCode) {
      res.status(400).json({
        success: false,
        error: 'Incorrect verification code. Please check your email and try again.',
      });
      return;
    }

    const updated = await db.updateUser(user._id, {
      isEmailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined,
    });

    if (!updated) {
      res.status(500).json({ success: false, error: 'Failed to update email verification status.' });
      return;
    }

    await db.createNotification({
      _id: `notif-${Date.now()}`,
      userId: user._id,
      type: 'system',
      title: 'Email Verified!',
      message: 'Your university email has been verified. You now have full marketplace privileges.',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    const formatted = await formatUserResponse(updated);
    const sessionToken = signAuthToken(updated._id, updated.role);

    res.json({
      success: true,
      message: 'Email verified successfully!',
      user: formatted,
      data: { user: formatted },
      token: sessionToken,
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify email.' });
  }
}

export async function resendVerificationCode(req: Request, res: Response): Promise<void> {
  try {
    const { email: reqEmail, userId: reqUserId } = req.body;
    let user = req.user;

    if (!user && reqUserId) {
      user = await db.findUserById(reqUserId);
    }
    if (!user && reqEmail) {
      user = await db.findUserByEmail(reqEmail);
    }

    if (!user) {
      res.status(404).json({ success: false, error: 'User account not found.' });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({ success: false, error: 'Email is already verified.' });
      return;
    }

    if (user.emailVerificationExpires) {
      const expiresAt = new Date(user.emailVerificationExpires).getTime();
      const issuedAt = expiresAt - 15 * 60 * 1000;
      const elapsedSeconds = (Date.now() - issuedAt) / 1000;
      if (elapsedSeconds < 15) {
        res.status(429).json({
          success: false,
          error: `Please wait ${Math.ceil(15 - elapsedSeconds)} seconds before requesting a new code.`,
        });
        return;
      }
    }

    const newOtp = generateOTP();
    const univ = user.universityId ? await db.findUniversityById(user.universityId) : null;

    const emailResult = await sendVerificationEmail({
      to: user.email,
      name: user.name,
      code: newOtp,
      universityName: univ?.name || 'Your University',
    });

    const isDev = process.env.NODE_ENV !== 'production';
    const allowOtpPreview = isDev || process.env.ALLOW_DEMO_OTP_PREVIEW === 'true';

    if (!emailResult.success) {
      console.error(`[Auth] Resend OTP email failed for ${user.email}:`, emailResult.error);
      if (process.env.ALLOW_DEMO_OTP_PREVIEW === 'true') {
        await db.updateUser(user._id, {
          emailVerificationToken: newOtp,
          emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });
        res.json({
          success: true,
          emailSent: false,
          emailDeliveryError: emailResult.error,
          message: `Demo preview OTP generated because live email delivery is unconfigured: ${emailResult.error}`,
          otpPreview: newOtp,
          data: { otpPreview: newOtp },
        });
        return;
      }
      res.status(502).json({
        success: false,
        emailSent: false,
        error: `Could not deliver verification email: ${emailResult.error}. Please check your email configuration.`,
      });
      return;
    }

    await db.updateUser(user._id, {
      emailVerificationToken: newOtp,
      emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    res.json({
      success: true,
      emailSent: true,
      emailDeliveryProvider: emailResult.provider,
      message: `A fresh 6-digit verification code has been dispatched to ${user.email}.`,
      otpPreview: allowOtpPreview ? newOtp : undefined,
      data: {
        otpPreview: allowOtpPreview ? newOtp : undefined,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to resend verification code.' });
  }
}

export function getEmailStatus(_req: Request, res: Response): void {
  const status = getEmailProviderStatus();
  res.json({
    success: true,
    data: status,
    environment: process.env.NODE_ENV || 'development',
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated.' });
    return;
  }
  const formatted = await formatUserResponse(req.user);
  res.json({
    success: true,
    user: formatted,
    data: { user: formatted },
  });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, message: 'Logged out successfully.' });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, error: 'Email address is required.' });
    return;
  }

  const user = await db.findUserByEmail(email);
  if (!user) {
    res.json({ success: true, message: 'If this email is registered, a password reset link has been dispatched.' });
    return;
  }

  const resetToken = generateToken();
  await db.updateUser(user._id, {
    resetPasswordToken: resetToken,
    resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });

  res.json({
    success: true,
    message: 'Password reset link sent to your university email.',
    resetTokenPreview: resetToken,
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, newPassword } = req.body;

  if (!token || !newPassword || newPassword.length < 6) {
    res.status(400).json({ success: false, error: 'Valid reset token and new password (min 6 chars) are required.' });
    return;
  }

  const allUsers = await db.getAllUsers();
  const user = allUsers.find((u) => u.resetPasswordToken === token);

  if (!user) {
    res.status(400).json({ success: false, error: 'Invalid or expired password reset token.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  await db.updateUser(user._id, {
    passwordHash: hash,
    salt,
    resetPasswordToken: undefined,
    resetPasswordExpires: undefined,
  });

  res.json({ success: true, message: 'Password has been updated. You may now log in with your new credentials.' });
}
