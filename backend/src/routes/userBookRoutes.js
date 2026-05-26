const express = require("express");
const {
  getUserBooks,
  getUserBookStatus,
  setBookStatus,
  removeUserBook,
  getReadingStats,
  updateFinishedDate,
  getBookReaders,
  getBookTBR,
  toggleOwned,
  getBookOwners,
  toggleHidden,
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
router.get("/tbr/:bookId", getBookTBR);
router.get("/owners/:bookId", getBookOwners);
router.patch("/:bookId/owned", toggleOwned);
router.patch("/:bookId/hidden", toggleHidden);

// Set/update status
router.post("/", setBookStatus);

// Update finished date
router.patch("/:id", updateFinishedDate);

// Remove book
router.delete("/:id", removeUserBook);

module.exports = router;
