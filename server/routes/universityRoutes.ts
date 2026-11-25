import { Router } from 'express';
import {
  getUniversities,
  getUniversityById,
  createUniversity,
  updateUniversity,
  deleteUniversity,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/universityController';
import { authenticate, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// Publicly readable endpoints (for registration and university filtering)
router.get('/', getUniversities);
router.get('/:id', getUniversityById);
router.get('/meta/departments', getDepartments);

// Admin-only management endpoints
router.post('/', authenticate, requireAdmin, createUniversity);
router.put('/:id', authenticate, requireAdmin, updateUniversity);
router.delete('/:id', authenticate, requireAdmin, deleteUniversity);

router.post('/departments/create', authenticate, requireAdmin, createDepartment);
router.put('/departments/:id', authenticate, requireAdmin, updateDepartment);
router.delete('/departments/:id', authenticate, requireAdmin, deleteDepartment);

export default router;
