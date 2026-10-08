const express = require("express");
const {
  getCalendar,
  getDay,
  getDayImage,
  submitAttempt,
  searchCandidates,
  getLeaderboard,
  adminListDays,
  adminUpdateDay,
  adminUploadDayImage,
  adminPublishDue,
  adminRecalculateBadges,
  adminGetVisibility,
  adminSetVisibility,
} = require("../controllers/adventController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { adventAttemptLimiter } = require("../middleware/adventRateLimit");
const { adventImageUpload } = require("../middleware/adventImageUpload");
const { requireFeatureVisible } = require("../utils/featureVisibility");

const router = express.Router();

router.use(protect);

const visible = requireFeatureVisible((req) => `advent:${req.params.year}:visibility`);

router.get("/search", searchCandidates);

// These admin/leaderboard routes must come before the generic "/:year/:day"
// below - "admin" and "leaderboard" would otherwise be swallowed by :day
// and 404 as an invalid door number instead of ever reaching these
// handlers (same pitfall for any new literal-segment route added here).
router.get("/:year/admin", authorize("admin"), adminListDays);
router.get("/:year/admin/visibility", authorize("admin"), adminGetVisibility);
router.put("/:year/admin/visibility", authorize("admin"), adminSetVisibility);
router.get("/:year/leaderboard", visible, getLeaderboard);

router.get("/:year", visible, getCalendar);
router.get("/:year/:day", visible, getDay);
router.get("/:year/:day/image/:level", visible, getDayImage);
router.post("/:year/:day/attempt", visible, adventAttemptLimiter, submitAttempt);

router.put("/:year/:day/admin", authorize("admin"), adminUpdateDay);
router.post("/:year/:day/admin/image", authorize("admin"), adventImageUpload.single("cover"), adminUploadDayImage);
router.post("/:year/admin/publish-due", authorize("admin"), adminPublishDue);
router.post("/:year/admin/recalculate-badges", authorize("admin"), adminRecalculateBadges);

module.exports = router;
