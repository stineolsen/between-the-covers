const express = require("express");
const {
  getMeetings,
  getNextMeeting,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  rsvpMeeting,
} = require("../controllers/meetingController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public (authenticated) routes
router.get("/", getMeetings);
router.get("/next", getNextMeeting);
router.get("/:id", getMeeting);
router.post("/:id/rsvp", rsvpMeeting);

// Admin only routes
router.post("/", authorize("admin"), createMeeting);
router.put("/:id", authorize("admin"), updateMeeting);
router.delete("/:id", authorize("admin"), deleteMeeting);

module.exports = router;
