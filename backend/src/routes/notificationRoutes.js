const express = require("express");
const { sendFeatureAlertEmail } = require("../controllers/notificationController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("admin"));

router.post("/feature-alert", sendFeatureAlertEmail);

module.exports = router;
