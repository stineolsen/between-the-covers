const express = require("express");
const {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  toggleLike,
  getUserReviewForBook,
  adminSetRating,
} = require("../controllers/reviewController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// All review routes require authentication
router.use(protect);

// Public routes (for logged-in users)
router.get("/", getReviews);
router.get("/:id", getReview);
router.get("/book/:bookId/user", getUserReviewForBook);

// Admin: set rating for any user
router.post("/admin", authorize("admin"), adminSetRating);

// Create, update, delete (member routes)
router.post("/", createReview);
router.put("/:id", updateReview);
router.delete("/:id", deleteReview);

// Like functionality
router.post("/:id/like", toggleLike);

module.exports = router;
