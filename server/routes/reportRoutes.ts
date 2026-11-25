import { Router } from 'express';
import { createReport, getAdminReports, resolveReport } from '../controllers/reportController';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// Allow authenticated or guest report submissions
router.post('/', createReport);

// Admin moderation endpoints
router.get('/admin', requireAuth, requireAdmin, getAdminReports);
router.put('/admin/:id', requireAuth, requireAdmin, resolveReport);

export default router;
