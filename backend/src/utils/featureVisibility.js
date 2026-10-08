const Setting = require("../models/Setting");

// Generic per-feature, per-year launch toggle, built on the same Setting
// model the Calibre import date and Bokwrapped window already use. Three
// states:
//   "open"       - normal access for every approved member.
//   "admin-only" - everyone except admins gets a 404.
//   "hidden"     - everyone, admins included, gets a 404 on the
//                  member-facing routes (admin's own CRUD/management
//                  endpoints for the feature are separate routes, gated by
//                  authorize("admin") directly, and are never affected by
//                  this - so admins can keep editing data while the
//                  player-facing side is fully dark).
// Always a 404, never a 403 - a 403 would confirm the feature exists
// before it's meant to be visible. Defaults to "open" when nothing has
// been set yet, so existing features keep working unless an admin
// deliberately restricts them.

const VALID_VALUES = ["open", "admin-only", "hidden"];

async function getVisibility(settingKey) {
  const setting = await Setting.findOne({ key: settingKey });
  return VALID_VALUES.includes(setting?.value) ? setting.value : "open";
}

async function setVisibility(settingKey, value) {
  if (!VALID_VALUES.includes(value)) {
    throw new Error(`Ugyldig synlighet - må være en av: ${VALID_VALUES.join(", ")}`);
  }
  await Setting.findOneAndUpdate({ key: settingKey }, { key: settingKey, value }, { upsert: true });
  return value;
}

// Express middleware factory. `settingKeyFromReq` builds the Setting key
// from the request (e.g. per-year), since this gate is reused across
// features and years.
function requireFeatureVisible(settingKeyFromReq) {
  return async (req, res, next) => {
    try {
      const visibility = await getVisibility(settingKeyFromReq(req));
      if (visibility === "hidden") {
        return res.status(404).json({ success: false, message: "Fant ikke siden" });
      }
      if (visibility === "admin-only" && req.user?.role !== "admin") {
        return res.status(404).json({ success: false, message: "Fant ikke siden" });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { getVisibility, setVisibility, requireFeatureVisible };
