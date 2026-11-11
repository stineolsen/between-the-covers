const express = require("express");
const {
  getMyBadges,
  getAdminStatus,
  getAdminPreview,
  setAdminLaunch,
  recalculate,
} = require("../controllers/badgeController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/me", getMyBadges);

router.get("/admin/status", authorize("admin"), getAdminStatus);
router.get("/admin/preview", authorize("admin"), getAdminPreview);
router.put("/admin/launch", authorize("admin"), setAdminLaunch);
router.post("/admin/recalculate", authorize("admin"), recalculate);

module.exports = router;
