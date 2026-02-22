const express = require('express');
const {
  createRecommendation,
  getMyRecommendations,
  dismissRecommendation
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', createRecommendation);
router.get('/mine', getMyRecommendations);
router.patch('/:id/dismiss', dismissRecommendation);

module.exports = router;
