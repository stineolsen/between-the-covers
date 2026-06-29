const cron = require("node-cron");
const { sendDueDigests } = require("./emailService");

// "Due" is computed from each user's persisted lastNotifiedAt, not from cron
// timing, so an hourly check is plenty of precision for daily/weekly/etc.
// digests and a restart/redeploy can't cause a missed or duplicate send.
function startNotificationScheduler() {
  cron.schedule("0 * * * *", () => {
    sendDueDigests().catch((error) => {
      console.error("sendDueDigests failed:", error);
    });
  });
  console.log("Notification scheduler started (hourly digest check)");
}

module.exports = { startNotificationScheduler };
