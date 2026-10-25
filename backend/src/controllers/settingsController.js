const Setting = require("../models/Setting");

const SEASONAL_THEME_KEY = "site:seasonalTheme";
const VALID_THEMES = ["halloween", "jul", "nyttaar"];

// @desc    Current site-wide seasonal theme (or null for the standard look)
// @route   GET /api/settings/seasonal-theme
// @access  Private
exports.getSeasonalTheme = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: SEASONAL_THEME_KEY });
    const theme = VALID_THEMES.includes(setting?.value) ? setting.value : null;
    res.status(200).json({ success: true, theme });
  } catch (error) {
    console.error("Get seasonal theme error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente sesongtema" });
  }
};

// @desc    Set (or clear, with theme: null) the site-wide seasonal theme
// @route   PUT /api/settings/seasonal-theme
// @access  Private/Admin
exports.setSeasonalTheme = async (req, res) => {
  try {
    const { theme } = req.body;
    if (theme !== null && !VALID_THEMES.includes(theme)) {
      return res.status(400).json({
        success: false,
        message: `Ugyldig tema - må være null eller en av: ${VALID_THEMES.join(", ")}`,
      });
    }
    await Setting.findOneAndUpdate(
      { key: SEASONAL_THEME_KEY },
      { key: SEASONAL_THEME_KEY, value: theme },
      { upsert: true },
    );
    res.status(200).json({ success: true, theme });
  } catch (error) {
    console.error("Set seasonal theme error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke lagre sesongtema" });
  }
};
