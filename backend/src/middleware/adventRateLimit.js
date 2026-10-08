const rateLimit = require("express-rate-limit");

// Only the attempt endpoint needs this - everything else is read-only or
// already bounded by the 4-attempts-per-door rule enforced in the
// controller itself.
const adventAttemptLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // This middleware only ever runs after `protect` (see adventRoutes.js),
  // so req.user is always set - no IP fallback needed.
  keyGenerator: (req) => req.user._id.toString(),
  message: { success: false, message: "For mange forsøk - vent litt og prøv igjen." },
});

module.exports = { adventAttemptLimiter };
