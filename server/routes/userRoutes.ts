import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getPublicProfile,
} from '../controllers/userController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.get('/:id', getPublicProfile);

export default router;
