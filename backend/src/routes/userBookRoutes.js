const express = require("express");
const {
  getUserBooks,
  getUserBookStatus,
  setBookStatus,
  removeUserBook,
  getReadingStats,
  updateFinishedDate,
  getBookReaders,
} = require("../controllers/userBookController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get user's books and stats
router.get("/", getUserBooks);
router.get("/stats", getReadingStats);
router.get("/book/:bookId", getUserBookStatus);
router.get("/readers/:bookId", getBookReaders);

// Set/update status
router.post("/", setBookStatus);

// Update finished date
router.patch("/:id", updateFinishedDate);

// Remove book
router.delete("/:id", removeUserBook);

module.exports = router;
