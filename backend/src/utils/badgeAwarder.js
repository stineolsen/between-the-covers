const AdventDay = require("../models/AdventDay");
const AdventResult = require("../models/AdventResult");
const Badge = require("../models/Badge");
const UserBadge = require("../models/UserBadge");
const User = require("../models/User");
const { DOOR_COUNT_BADGE_THRESHOLDS } = require("../constants/adventConfig");

function doorCountBadgeKey(year, threshold) {
  return `advent-doors-${year}-${threshold}`;
}

async function ensureDoorCountBadge(year, threshold) {
  return Badge.findOneAndUpdate(
    { key: doorCountBadgeKey(year, threshold) },
    {
      $setOnInsert: {
        key: doorCountBadgeKey(year, threshold),
        name: `${threshold} luker`,
        description:
          threshold === 24
            ? "Alle 24 luker løst innen fristen"
            : `${threshold} luker riktig løst innen fristen`,
        icon: threshold === 24 ? "crown" : "snow",
        year,
      },
    },
    { upsert: true, new: true },
  );
}

// Idempotent by design: awarding uses upsert-with-$setOnInsert against
// UserBadge's unique (user, badge) index, so calling this again for a user
// who already has the badge is a no-op, not an error.
async function awardBadge(userId, badgeId) {
  await UserBadge.updateOne(
    { user: userId, badge: badgeId },
    { $setOnInsert: { user: userId, badge: badgeId, awardedAt: new Date() } },
    { upsert: true },
  );
}

// Counts this user's doors solved within the leaderboard deadline for a
// given year, and awards every door-count badge they've now crossed. Safe
// to call after every solved door, or re-run in bulk for the whole year via
// recalculateDoorCountBadgesForYear (e.g. launching badges after Dec 1 for
// everything that already happened).
async function awardDoorCountBadgesForUser(userId, year) {
  const doorIds = await AdventDay.find({ year }).distinct("_id");
  const solvedCount = await AdventResult.countDocuments({
    user: userId,
    adventDay: { $in: doorIds },
    status: "solved",
    countsForLeaderboard: true,
    isTestPlay: { $ne: true },
  });

  const earned = DOOR_COUNT_BADGE_THRESHOLDS.filter((threshold) => solvedCount >= threshold);
  for (const threshold of earned) {
    const badge = await ensureDoorCountBadge(year, threshold);
    await awardBadge(userId, badge._id);
  }
  return { solvedCount, earnedThresholds: earned };
}

// Admin "recompute" entry point - re-runs the door-count check for every
// member, for a given year. Repeatable without side effects.
async function recalculateDoorCountBadgesForYear(year) {
  const users = await User.find({ status: "approved" }).select("_id");
  const results = [];
  for (const user of users) {
    results.push({ userId: user._id, ...(await awardDoorCountBadgesForUser(user._id, year)) });
  }
  return results;
}

module.exports = { awardDoorCountBadgesForUser, recalculateDoorCountBadgesForYear };
