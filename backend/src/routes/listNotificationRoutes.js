const express = require("express");
const {
  getMyListNotifications,
  dismissListNotification,
} = require("../controllers/listNotificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/mine", getMyListNotifications);
router.patch("/:id/dismiss", dismissListNotification);

module.exports = router;
