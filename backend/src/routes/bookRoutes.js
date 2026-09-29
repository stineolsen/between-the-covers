const express = require("express");
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  getBooksByStatus,
  getGenres,
  getSeriesNames,
  uploadCover,
  searchExternalSources,
} = require("../controllers/bookController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { uploadSingle } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Public/Member routes
router.get("/", protect, getBooks);
router.get("/genres", protect, getGenres);
router.get("/series", protect, getSeriesNames);
router.get("/status/:status", protect, getBooksByStatus);
// Must come before "/:id" — otherwise Express matches "search-external" as :id.
router.get("/search-external", protect, searchExternalSources);
router.get("/:id", protect, getBook);

// All members can add books
router.post("/", protect, uploadSingle("coverImage"), createBook);

// Admin only routes
router.put(
  "/:id",
  protect,
  authorize("admin"),
  uploadSingle("coverImage"),
  updateBook,
);
router.delete("/:id", protect, authorize("admin"), deleteBook);
router.post(
  "/:id/cover",
  protect,
  authorize("admin"),
  uploadSingle("coverImage"),
  uploadCover,
);

module.exports = router;
