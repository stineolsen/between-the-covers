const express = require("express");
const { getBooksByAuthor } = require("../controllers/bookController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:authorNormalized", protect, getBooksByAuthor);

module.exports = router;
