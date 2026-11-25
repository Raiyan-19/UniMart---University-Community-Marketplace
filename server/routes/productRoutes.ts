import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleWishlist,
  getUserWishlist,
  getMyListings,
  getCampusServices,
  createCampusService,
  getServiceCategories,
  getGraduationSales,
  createGraduationSale,
  updateGraduationSale,
  deleteGraduationSale,
  getGuides,
} from '../controllers/productController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Public / Guest accessible endpoints
router.get('/', getProducts);
router.get('/services', getCampusServices);
router.post('/services', requireAuth, createCampusService);
router.get('/service-categories', getServiceCategories);
router.get('/guides', getGuides);
router.get('/graduation-sales', getGraduationSales);
router.post('/graduation-sales', requireAuth, createGraduationSale);
router.put('/graduation-sales/:id', requireAuth, updateGraduationSale);
router.delete('/graduation-sales/:id', requireAuth, deleteGraduationSale);
router.get('/wishlist', requireAuth, getUserWishlist);
router.get('/my-listings', requireAuth, getMyListings);
router.get('/:id', getProductById);

// Authenticated product actions
router.post('/', requireAuth, createProduct);
router.put('/:id', requireAuth, updateProduct);
router.delete('/:id', requireAuth, deleteProduct);
router.post('/:id/wishlist', requireAuth, toggleWishlist);

export default router;
