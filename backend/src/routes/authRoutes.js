const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  getPendingUsers,
  approveUser
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// Admin only routes
router.get('/pending', protect, authorize('admin'), getPendingUsers);
router.put('/approve/:id', protect, authorize('admin'), approveUser);

module.exports = router;
