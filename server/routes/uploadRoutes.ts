import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { uploadImage } from '../controllers/uploadController';

const router = Router();

router.post('/', authenticate, uploadImage);

export default router;
