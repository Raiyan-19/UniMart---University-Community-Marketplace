import { Router } from 'express';
import {
  getConversations,
  getConversationMessages,
  sendMessage,
  startConversationForProduct,
} from '../controllers/chatController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/conversations', getConversations);
router.post('/start', startConversationForProduct);
router.get('/conversations/:id/messages', getConversationMessages);
router.post('/conversations/:id/messages', sendMessage);

export default router;
