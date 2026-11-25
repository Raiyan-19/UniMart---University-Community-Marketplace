import { Router } from 'express';
import { getReviews, createReview } from '../controllers/reviewController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getReviews);
router.post('/', requireAuth, createReview);

export default router;
