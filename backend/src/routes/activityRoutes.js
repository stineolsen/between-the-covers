const express = require('express');
const { getActivity } = require('../controllers/activityController');
const {
  toggleReaction,
  getComments,
  createComment,
  updateComment,
  deleteComment,
} = require('../controllers/feedController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getActivity);

router.post('/:type/:id/reactions', toggleReaction);
router.get('/:type/:id/comments', getComments);
router.post('/:type/:id/comments', createComment);
router.put('/comments/:commentId', updateComment);
router.delete('/comments/:commentId', deleteComment);

module.exports = router;
