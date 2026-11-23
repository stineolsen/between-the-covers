const express = require("express");
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/authMiddleware");
const { getTokenStatus, createToken, deleteToken, widgetAuth, getWidgetData } = require("../controllers/widgetController");

const router = express.Router();

// Widgets refresh roughly every 15 minutes per widget; this leaves room for
// several widgets on one phone. Keyed on the member (it runs after
// widgetAuth) - keys are 192 random bits, so guessing them isn't a concern.
const widgetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user._id.toString(),
  message: { success: false, message: "For mange oppdateringer - prøv igjen om litt" },
});

router.get("/token", protect, getTokenStatus);
router.post("/token", protect, createToken);
router.delete("/token", protect, deleteToken);
router.get("/", widgetAuth, widgetLimiter, getWidgetData);

module.exports = router;
