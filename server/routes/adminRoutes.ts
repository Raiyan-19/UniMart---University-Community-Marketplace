import { Router } from 'express';
import {
  getAllUsers,
  toggleVerifyUser,
  updateUserStatus,
  updateUserRole,
  getAdminStats,
  bulkVerifyUsers,
  getAuditLogs,
} from '../controllers/userController';
import {
  addServiceCategory,
  deleteServiceCategory,
  getGuides,
  createGuide,
  updateGuide,
  deleteGuide,
  getAllAdminListings,
  updateListingModerationStatus,
  deleteProduct,
} from '../controllers/productController';
import { authenticate, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// Protect all admin endpoints
router.use(authenticate, requireAdmin);

router.get('/users', getAllUsers);
router.post('/users/bulk-verify', bulkVerifyUsers);
router.put('/users/:id/verify', toggleVerifyUser);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);
router.get('/stats', getAdminStats);
router.get('/audit-logs', getAuditLogs);

// Listings Moderation
router.get('/listings', getAllAdminListings);
router.put('/listings/:id/status', updateListingModerationStatus);
router.delete('/listings/:id', deleteProduct);

// Service Categories Management
router.post('/service-categories', addServiceCategory);
router.delete('/service-categories/:name', deleteServiceCategory);

// Guides Management
router.get('/guides', getGuides);
router.post('/guides', createGuide);
router.put('/guides/:id', updateGuide);
router.delete('/guides/:id', deleteGuide);

export default router;
