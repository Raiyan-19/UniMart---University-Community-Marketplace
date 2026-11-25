import { Router } from 'express';
import {
  register,
  login,
  getMe,
  logout,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
  getEmailStatus,
} from '../controllers/authController';
import { authenticate, optionalAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/email-status', getEmailStatus);
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', optionalAuth, verifyEmail);
router.post('/resend-code', optionalAuth, resendVerificationCode);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Session routes
router.get('/me', authenticate, getMe);
router.post('/logout', logout);

export default router;
