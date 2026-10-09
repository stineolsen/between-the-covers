const express = require("express");
const { getSeasonalTheme, setSeasonalTheme } = require("../controllers/settingsController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Any approved member can read the current theme (it applies site-wide,
// unlike the Bokwrapped/Julekalender visibility toggles which are meant to
// stay hidden from members until launched).
router.get("/seasonal-theme", getSeasonalTheme);
router.put("/seasonal-theme", authorize("admin"), setSeasonalTheme);

module.exports = router;
