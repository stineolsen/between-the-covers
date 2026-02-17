const express = require('express');
const { submitContactOrder } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Submit contact form order
router.post('/contact-order', submitContactOrder);

module.exports = router;
