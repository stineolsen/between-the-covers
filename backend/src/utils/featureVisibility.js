const Setting = require("../models/Setting");

// Generic per-feature, per-year launch toggle, built on the same Setting
// model the Calibre import date and Bokwrapped window already use. Two
// states only: "open" (normal access for every approved member) and
// "admin-only" (everyone else gets a 404, as if the route didn't exist -
// never a 403, which would confirm the feature exists before it's
// launched). Defaults to "open" when nothing has been set yet, so existing
// features keep working unless an admin deliberately restricts them.

async function getVisibility(settingKey) {
  const setting = await Setting.findOne({ key: settingKey });
  return setting?.value === "admin-only" ? "admin-only" : "open";
}

async function setVisibility(settingKey, value) {
  if (value !== "open" && value !== "admin-only") {
    throw new Error("Ugyldig synlighet - må være 'open' eller 'admin-only'");
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
      if (req.user?.role === "admin") return next();
      const visibility = await getVisibility(settingKeyFromReq(req));
      if (visibility === "admin-only") {
        return res.status(404).json({ success: false, message: "Fant ikke siden" });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { getVisibility, setVisibility, requireFeatureVisible };
