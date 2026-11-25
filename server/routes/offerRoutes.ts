import { Router } from 'express';
import {
  getUserOffers,
  createOffer,
  acceptOffer,
  rejectOffer,
  cancelOffer,
} from '../controllers/offerController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/', getUserOffers);
router.post('/', createOffer);
router.put('/:id/accept', acceptOffer);
router.put('/:id/reject', rejectOffer);
router.put('/:id/cancel', cancelOffer);

export default router;
