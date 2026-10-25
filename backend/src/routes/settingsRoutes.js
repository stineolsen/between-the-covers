const express = require("express");
const {
  getSeasonalTheme,
  setSeasonalTheme,
  getBanner,
  getBannerForAdmin,
  setBanner,
} = require("../controllers/settingsController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Any approved member can read the current theme (it applies site-wide,
// unlike the Bokwrapped/Julekalender visibility toggles which are meant to
// stay hidden from members until launched).
router.get("/seasonal-theme", getSeasonalTheme);
router.put("/seasonal-theme", authorize("admin"), setSeasonalTheme);

// Site-wide homepage banner (any approved member reads the live version;
// only admins can read the raw saved value while disabled, or change it).
router.get("/banner", getBanner);
router.get("/banner/admin", authorize("admin"), getBannerForAdmin);
router.put("/banner", authorize("admin"), setBanner);

module.exports = router;
