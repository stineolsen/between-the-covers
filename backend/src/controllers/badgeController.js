const UserBadge = require("../models/UserBadge");
const Setting = require("../models/Setting");
const { BADGE_FAMILIES, BADGES_LAUNCH_SETTING } = require("../constants/badgeConfig");
const {
  isBadgesLaunched,
  setBadgesLaunched,
  evaluateBadges,
  awardBadgesForUser,
  recalculateAllBadges,
  previewAllBadges,
} = require("../utils/badgeAwarder");

const familyByKey = new Map(BADGE_FAMILIES.map((f) => [f.key, f]));

// Family list without the tier rules - what the pages need to draw headings
const familySummaries = () =>
  BADGE_FAMILIES.map(({ key, name, color, icon, description, perYear }) => ({ key, name, color, icon, description, perYear: !!perYear }));

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
      badges: userBadges
        .filter((ub) => ub.badge)
        .map((ub) => {
          const badge = ub.badge.toObject();
          const family = familyByKey.get(badge.family);
          return { ...badge, color: family?.color || null, familyName: family?.name || null, awardedAt: ub.awardedAt };
        }),
    });
  } catch (error) {
    console.error("Get user badges error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente badges" });
  }
};

// @desc    The signed-in member's whole badge catalogue with progress. Before
//          launch members just get `launched: false`; admins get a preview
//          of what they'd hold.
// @route   GET /api/badges/me
// @access  Private
exports.getMyBadges = async (req, res) => {
  try {
    const launched = await isBadgesLaunched();
    const isAdmin = req.user.role === "admin";
    if (!launched && !isAdmin) {
      return res.status(200).json({ success: true, launched: false });
    }

    // Make sure everything earned is actually awarded before showing it
    if (launched) await awardBadgesForUser(req.user._id);

    const [{ entries }, awarded] = await Promise.all([
      evaluateBadges(req.user._id),
      UserBadge.find({ user: req.user._id }).populate("badge", "key").lean(),
    ]);
    const awardedAt = new Map(awarded.filter((ub) => ub.badge).map((ub) => [ub.badge.key, ub.awardedAt]));

    res.status(200).json({
      success: true,
      launched,
      preview: !launched,
      families: familySummaries(),
      badges: entries.map((e) => {
        const earned = launched ? awardedAt.has(e.key) || e.earned : e.earned;
        return {
          key: e.key,
          family: e.family,
          name: e.secret && !earned ? null : e.name,
          rule: e.secret && !earned ? null : e.rule,
          label: e.secret && !earned ? "?" : e.label,
          goal: e.goal,
          value: e.secret ? null : e.value,
          year: e.year || null,
          secret: e.secret,
          top: !!e.top,
          earned,
          awardedAt: awardedAt.get(e.key) || null,
        };
      }),
    });
  } catch (error) {
    console.error("Get my badges error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente lesemerkene" });
  }
};

// @desc    Admin: launch status
// @route   GET /api/badges/admin/status
// @access  Private (admin only)
exports.getAdminStatus = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: BADGES_LAUNCH_SETTING }).lean();
    res.status(200).json({ success: true, launched: !!setting?.value?.enabled, at: setting?.value?.at || null });
  } catch (error) {
    console.error("Get badge status error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente status" });
  }
};

// @desc    Admin: what every member would hold right now (awards nothing)
// @route   GET /api/badges/admin/preview
// @access  Private (admin only)
exports.getAdminPreview = async (req, res) => {
  try {
    res.status(200).json({ success: true, members: await previewAllBadges(), families: familySummaries() });
  } catch (error) {
    console.error("Badge preview error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke lage forhåndsvisning" });
  }
};

// @desc    Admin: launch (or pause) lesemerker. Launching awards everything
//          earned so far, with one summary notification per member.
// @route   PUT /api/badges/admin/launch
// @access  Private (admin only)
exports.setAdminLaunch = async (req, res) => {
  try {
    const enabled = !!req.body.enabled;
    await setBadgesLaunched(enabled);
    let awarded = 0;
    if (enabled) {
      const results = await recalculateAllBadges({ notify: "summary" });
      awarded = results.reduce((sum, r) => sum + r.awarded, 0);
    }
    res.status(200).json({ success: true, launched: enabled, awarded });
  } catch (error) {
    console.error("Set badge launch error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke endre lanseringen" });
  }
};

// @desc    Admin: re-check every member now (normally done nightly)
// @route   POST /api/badges/admin/recalculate
// @access  Private (admin only)
exports.recalculate = async (req, res) => {
  try {
    if (!(await isBadgesLaunched())) {
      return res.status(400).json({ success: false, message: "Lesemerker er ikke lansert ennå" });
    }
    const results = await recalculateAllBadges();
    res.status(200).json({ success: true, awarded: results.reduce((sum, r) => sum + r.awarded, 0) });
  } catch (error) {
    console.error("Recalculate badges error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke beregne merkene" });
  }
};
