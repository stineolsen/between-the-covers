const express = require("express");
const {
  getActive,
  getAllForAdmin,
  createAnnouncement,
  deleteAnnouncement,
  dismissAnnouncement,
} = require("../controllers/announcementController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getActive);
router.get("/admin", authorize("admin"), getAllForAdmin);
router.post("/", authorize("admin"), createAnnouncement);
router.post("/:id/dismiss", dismissAnnouncement);
router.delete("/:id", authorize("admin"), deleteAnnouncement);

module.exports = router;
