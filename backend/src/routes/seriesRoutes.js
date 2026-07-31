const express = require("express");
const { getBooksBySeries } = require("../controllers/bookController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:seriesName", protect, getBooksBySeries);

module.exports = router;
