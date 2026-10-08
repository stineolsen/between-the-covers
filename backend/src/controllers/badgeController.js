const UserBadge = require("../models/UserBadge");

// @desc    Badges a member has earned - general-purpose, not advent-specific
// @route   GET /api/users/:id/badges
// @access  Private
exports.getUserBadges = async (req, res) => {
  try {
    const userBadges = await UserBadge.find({ user: req.params.id })
      .populate("badge")
      .sort({ awardedAt: -1 });
    res.status(200).json({
      success: true,
      badges: userBadges.filter((ub) => ub.badge).map((ub) => ({ ...ub.badge.toObject(), awardedAt: ub.awardedAt })),
    });
  } catch (error) {
    console.error("Get user badges error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente badges" });
  }
};
