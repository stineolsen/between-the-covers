const cron = require("node-cron");
const { sendDigestsFor, sendPendingRequestNotifications, checkForImmediateUpdates } = require("./emailService");

const TIMEZONE = "Europe/Oslo";

function runSafely(name, fn) {
  return () => {
    fn().catch((error) => {
      console.error(`${name} failed:`, error);
    });
  };
}

// Each digest frequency gets its own cron trigger timed to the cadence the
// user actually wants, rather than one shared poll - this avoids having to
// reason about calendar-length edge cases (e.g. Feb -> Mar is only 28 days)
// and "every other Monday" falls out naturally: biweekly shares the weekly
// Monday slot, but sendDigestsFor only finds something to send once ~14
// days have actually passed since that user's last digest.
function startNotificationScheduler() {
  cron.schedule("0 18 * * *", runSafely("daily digest", () => sendDigestsFor("daily", 1)), {
    timezone: TIMEZONE,
  });
  cron.schedule("0 18 * * 1", runSafely("weekly digest", () => sendDigestsFor("weekly", 7)), {
    timezone: TIMEZONE,
  });
  cron.schedule("0 18 * * 1", runSafely("biweekly digest", () => sendDigestsFor("biweekly", 14)), {
    timezone: TIMEZONE,
  });
  cron.schedule("0 18 1 * *", runSafely("monthly digest", () => sendDigestsFor("monthly", 30)), {
    timezone: TIMEZONE,
  });
  cron.schedule("* * * * *", runSafely("pending request notifications", sendPendingRequestNotifications), {
    timezone: TIMEZONE,
  });
  cron.schedule("*/10 * * * *", runSafely("immediate updates check", checkForImmediateUpdates), {
    timezone: TIMEZONE,
  });

  console.log(
    "Notification scheduler started (daily 18:00, weekly/biweekly Mon 18:00, monthly 1st 18:00, request-fulfilled every minute, immediate check every 10 min, Europe/Oslo)",
  );
}

module.exports = { startNotificationScheduler };
