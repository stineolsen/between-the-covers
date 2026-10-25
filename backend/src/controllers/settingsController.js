const Setting = require("../models/Setting");
const sanitizeHtml = require("sanitize-html");

const SEASONAL_THEME_KEY = "site:seasonalTheme";
const VALID_THEMES = ["halloween", "jul", "nyttaar"];

const BANNER_KEY = "site:banner";
// Deliberately small - this is formatting for a short site-wide notice, not
// a rich document editor, and keeping the allowlist tight limits how much
// damage a compromised admin account could do with it (it's rendered via
// dangerouslySetInnerHTML for every member on every page load).
const BANNER_SANITIZE_OPTIONS = {
  allowedTags: ["b", "strong", "i", "em", "u", "a", "br", "p", "ul", "ol", "li", "span"],
  allowedAttributes: { a: ["href", "target", "rel"], span: ["style"] },
  allowedStyles: { span: { color: [/^#[0-9a-fA-F]{3,6}$/] } },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
  },
};

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

// @desc    Current site-wide banner message (null if off or empty)
// @route   GET /api/settings/banner
// @access  Private
exports.getBanner = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: BANNER_KEY });
    const value = setting?.value;
    const banner = value?.enabled && value?.html ? { html: value.html } : null;
    res.status(200).json({ success: true, banner });
  } catch (error) {
    console.error("Get banner error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente meldingen" });
  }
};

// @desc    Admin-only - same as getBanner but always returns the raw saved
//          value (even while disabled), so the admin page can show what's
//          there without needing a separate "is it currently on" check.
// @route   GET /api/settings/banner/admin
// @access  Private/Admin
exports.getBannerForAdmin = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: BANNER_KEY });
    res.status(200).json({
      success: true,
      banner: { html: setting?.value?.html || "", enabled: !!setting?.value?.enabled },
    });
  } catch (error) {
    console.error("Get banner (admin) error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente meldingen" });
  }
};

// @desc    Set (and sanitize) the site-wide banner message
// @route   PUT /api/settings/banner
// @access  Private/Admin
exports.setBanner = async (req, res) => {
  try {
    const { html, enabled } = req.body;
    const cleanHtml = sanitizeHtml(html || "", BANNER_SANITIZE_OPTIONS).trim();
    const value = { html: cleanHtml, enabled: !!enabled };
    await Setting.findOneAndUpdate({ key: BANNER_KEY }, { key: BANNER_KEY, value }, { upsert: true });
    res.status(200).json({ success: true, banner: value });
  } catch (error) {
    console.error("Set banner error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke lagre meldingen" });
  }
};
