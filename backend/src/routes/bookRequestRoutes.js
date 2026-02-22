const express = require('express');
const {
  createRequest,
  getMyRequests,
  getAllRequests,
  markAsAdded
} = require('../controllers/bookRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', createRequest);
router.get('/mine', getMyRequests);
router.get('/', authorize('admin'), getAllRequests);
router.patch('/:id/added', authorize('admin'), markAsAdded);

module.exports = router;
