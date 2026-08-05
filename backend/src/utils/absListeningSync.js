const User = require("../models/User");
const { fetchAbsUsers, fetchAbsListeningSeconds } = require("./importHelpers");

// Refreshes absTotalListeningSeconds for every member who has an
// admin-assigned absUsername, by matching them against the Audiobookshelf
// user list and summing their listening-session history. Called both from
// the admin "sync now" route and the daily cron job (notificationScheduler.js).
async function syncAbsListeningStats() {
  const { ABS_BASE_URL, ABS_TOKEN } = process.env;
  if (!ABS_BASE_URL || !ABS_TOKEN) {
    throw new Error("Missing ABS_BASE_URL/ABS_TOKEN env vars");
  }

  const [absUsers, members] = await Promise.all([
    fetchAbsUsers(ABS_BASE_URL, ABS_TOKEN),
    User.find({ absUsername: { $nin: [null, ""] } }).select("_id absUsername"),
  ]);

  const absByUsername = new Map(absUsers.map((u) => [u.username.toLowerCase(), u]));

  let matched = 0;
  let unmatched = 0;

  for (const member of members) {
    const absUser = absByUsername.get(member.absUsername.toLowerCase());
    if (!absUser) {
      unmatched++;
      continue;
    }

    const totalSeconds = await fetchAbsListeningSeconds(ABS_BASE_URL, ABS_TOKEN, absUser.id);
    await User.findByIdAndUpdate(member._id, {
      absTotalListeningSeconds: totalSeconds,
      absLastSyncedAt: new Date(),
    });
    matched++;
  }

  return { checked: members.length, matched, unmatched };
}

module.exports = { syncAbsListeningStats };
