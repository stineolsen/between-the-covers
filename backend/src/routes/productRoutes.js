const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  submitContactOrder,
  getOrders,
  updateOrderStatus
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Order routes (must be before /:id to avoid conflicts)
router.post('/shop/order', submitContactOrder); // All authenticated users
router.get('/orders', authorize('admin'), getOrders); // Admin only
router.put('/orders/:id/status', authorize('admin'), updateOrderStatus); // Admin only

// Public (authenticated) routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Admin only routes
router.post('/', authorize('admin'), createProduct);
router.put('/:id', authorize('admin'), updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

module.exports = router;
