const express = require("express");
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  getBooksByStatus,
  getGenres,
  uploadCover,
} = require("../controllers/bookController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { uploadSingle } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Public/Member routes
router.get("/", protect, getBooks);
router.get("/genres", protect, getGenres);
router.get("/status/:status", protect, getBooksByStatus);
router.get("/:id", protect, getBook);

// Admin only routes
router.post(
  "/",
  protect,
  authorize("admin"),
  uploadSingle("coverImage"),
  createBook,
);
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
