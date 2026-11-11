const Setting = require("../models/Setting");
const User = require("../models/User");
const { createNotification } = require("./notificationCenter");

// Sends the "your Bokwrapped is ready" notification (in-app + push + email
// for members with feature alerts on) once a year's release time has
// passed. Run by the scheduler every few minutes; the release setting's
// `announced` flag is set before sending so an overlapping run can't send
// it twice.
async function announceDueReleases() {
  const settings = await Setting.find({ key: /^wrapped:\d+:release$/ });
  const now = new Date();

  for (const setting of settings) {
    const at = setting.value?.at ? new Date(setting.value.at) : null;
    if (!at || at > now || setting.value.announced) continue;

    const year = setting.key.split(":")[1];
    const claimed = await Setting.findOneAndUpdate(
      { _id: setting._id, "value.announced": { $ne: true } },
      { $set: { "value.announced": true } },
    );
    if (!claimed) continue;

    const members = await User.find({ status: "approved" }).select("_id");
    for (const member of members) {
      await createNotification({
        recipient: member._id,
        type: "wrapped-release",
        message: `Bokwrapped ${year} er her! 🎁 Se hvordan leseåret ditt ble.`,
        link: `/bokwrapped/${year}/resultat`,
      }).catch((error) => console.error("Wrapped release notification failed:", error));
    }
    console.log(`Announced Bokwrapped ${year} to ${members.length} members`);
  }
}

module.exports = { announceDueReleases };
