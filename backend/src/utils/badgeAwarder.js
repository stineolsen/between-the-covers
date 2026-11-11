const AdventDay = require("../models/AdventDay");
const AdventResult = require("../models/AdventResult");
const Badge = require("../models/Badge");
const UserBadge = require("../models/UserBadge");
const User = require("../models/User");
const UserBook = require("../models/UserBook");
const Book = require("../models/Book");
const Review = require("../models/Review");
const Meeting = require("../models/Meeting");
const Recommendation = require("../models/Recommendation");
const Setting = require("../models/Setting");
const WrappedResponse = require("../models/WrappedResponse");
const { createNotification } = require("./notificationCenter");
const { DOOR_COUNT_BADGE_THRESHOLDS } = require("../constants/adventConfig");
const {
  BADGE_FAMILIES,
  OLD_BOOK_AGE,
  MIN_SERIES_SIZE,
  MEETINGS_FROM,
  BADGES_LAUNCH_SETTING,
} = require("../constants/badgeConfig");

const id = (x) => String(x?._id || x);
const familyByKey = new Map(BADGE_FAMILIES.map((f) => [f.key, f]));

// ---------------------------------------------------------------- launch switch

// Lesemerker are off until an admin launches them (see setBadgesLaunched).
// The advent calendar's door-count badges predate this switch and are
// always awarded, as before.
async function isBadgesLaunched() {
  const setting = await Setting.findOne({ key: BADGES_LAUNCH_SETTING });
  return !!setting?.value?.enabled;
}

async function setBadgesLaunched(enabled) {
  await Setting.findOneAndUpdate(
    { key: BADGES_LAUNCH_SETTING },
    { key: BADGES_LAUNCH_SETTING, value: { enabled: !!enabled, at: new Date().toISOString() } },
    { upsert: true },
  );
}

// ---------------------------------------------------------------- metrics

// Years whose Bokwrapped results have been released - their reading
// personalities become badges. Required lazily: wrappedStats is heavy and
// only needed once a year has been released.
async function releasedWrappedYears() {
  const settings = await Setting.find({ key: /^wrapped:\d+:release$/ }).lean();
  const now = new Date();
  return settings
    .filter((s) => s.value?.at && new Date(s.value.at) <= now)
    .map((s) => Number(s.key.split(":")[1]));
}

// Every number the badge rules look at, for one member
async function computeMetrics(userId) {
  const uid = id(userId);
  const thisYear = new Date().getFullYear();

  const [user, reads, dnf, reviews, recommendations, meetings, wrappedResponses, adventResults, clubBooks] = await Promise.all([
    User.findById(uid).select("readingGoal absTotalListeningSeconds absListeningBooks").lean(),
    UserBook.find({ user: uid, status: "read" }).select("book startedAt finishedAt").lean(),
    UserBook.countDocuments({ user: uid, status: "dnf" }),
    Review.find({ user: uid }).select("content likeCount").lean(),
    Recommendation.countDocuments({ from: uid }),
    Meeting.find({ date: { $gte: MEETINGS_FROM, $lte: new Date() }, status: { $ne: "cancelled" } })
      .select("attendees date")
      .lean(),
    WrappedResponse.find({ user: uid }).select("year stepsCompleted attendanceConfirmed attendedMeetingIds").lean(),
    AdventResult.find({ user: uid, isTestPlay: { $ne: true } })
      .select("adventDay status attemptsUsed countsForLeaderboard")
      .lean(),
    Book.find({ bookclubMonth: { $nin: [null, ""] } }).select("bookclubMonth").lean(),
  ]);

  const bookIds = [...new Set(reads.filter((r) => r.book).map((r) => id(r.book)))];
  const books = await Book.find({ _id: { $in: bookIds } }).select("pageCount series publishedYear").lean();

  // Series: every book of a 3+ book series (as the library has it) read
  const myCountBySeries = new Map();
  for (const b of books) if (b.series) myCountBySeries.set(b.series, (myCountBySeries.get(b.series) || 0) + 1);
  const seriesSizes = myCountBySeries.size
    ? await Book.aggregate([
        { $match: { series: { $in: [...myCountBySeries.keys()] } } },
        { $group: { _id: "$series", size: { $sum: 1 } } },
      ])
    : [];
  const series = seriesSizes.filter((s) => s.size >= MIN_SERIES_SIZE && myCountBySeries.get(s._id) >= s.size).length;

  // Meetings: the member's confirmed attendance from Bokwrapped where they
  // gave one, otherwise their RSVPs
  const confirmedByYear = new Map(
    wrappedResponses.filter((r) => r.attendanceConfirmed).map((r) => [r.year, new Set((r.attendedMeetingIds || []).map(id))]),
  );
  const meetingsAttended = meetings.filter((m) => {
    const confirmed = confirmedByYear.get(new Date(m.date).getFullYear());
    return confirmed ? confirmed.has(id(m)) : (m.attendees || []).some((a) => id(a) === uid);
  }).length;

  // Trofast: read every bookclub book of some year that had at least three
  const read = new Set(bookIds);
  const clubByYear = new Map();
  for (const b of clubBooks) {
    const year = b.bookclubMonth.match(/\d{4}/)?.[0];
    if (year) clubByYear.set(year, [...(clubByYear.get(year) || []), id(b)]);
  }
  const trofast = [...clubByYear.values()].some((ids) => ids.length >= 3 && ids.every((b) => read.has(b)));

  // Advent: doors solved in time per year, plus the cross-year extras
  const days = await AdventDay.find({ _id: { $in: adventResults.map((r) => r.adventDay) } }).select("year day").lean();
  const dayById = new Map(days.map((d) => [id(d), d]));
  const solved = adventResults.filter((r) => r.status === "solved");
  const adventDoorsByYear = {};
  for (const r of solved) {
    const day = dayById.get(id(r.adventDay));
    if (day && r.countsForLeaderboard) adventDoorsByYear[day.year] = (adventDoorsByYear[day.year] || 0) + 1;
  }

  // Reads per finish year, for the reading goal
  const readsByYear = {};
  for (const r of reads) {
    if (!r.finishedAt) continue;
    const y = new Date(r.finishedAt).getFullYear();
    readsByYear[y] = (readsByYear[y] || 0) + 1;
  }
  const goalYears = user?.readingGoal
    ? Object.keys(readsByYear).map(Number).filter((y) => y <= thisYear && readsByYear[y] >= user.readingGoal)
    : [];

  // The year's reading personality, for each released Bokwrapped year
  const personalities = {};
  const released = await releasedWrappedYears();
  if (released.length) {
    const { getYearStats } = require("./wrappedStats");
    for (const year of released) {
      const p = (await getYearStats(year)).perUser.get(uid)?.personality;
      if (p && p.key !== "allround") personalities[year] = p;
    }
  }

  const sameDay = reads.some(
    (r) => r.startedAt && r.finishedAt && new Date(r.startedAt).toDateString() === new Date(r.finishedAt).toDateString(),
  );

  return {
    books: bookIds.length,
    pages: books.reduce((sum, b) => sum + (b.pageCount || 0), 0),
    audioHours: Math.floor((user?.absTotalListeningSeconds || 0) / 3600),
    audioRepeat: (user?.absListeningBooks || []).some((b) => b.duration && b.totalSeconds / b.duration >= 2) ? 1 : 0,
    reviews: reviews.filter((r) => (r.content || "").trim()).length,
    ratings: reviews.length,
    likesReceived: reviews.reduce((sum, r) => sum + (r.likeCount || 0), 0),
    dnf,
    series,
    oldBooks: books.filter((b) => b.publishedYear && b.publishedYear <= thisYear - OLD_BOOK_AGE).length,
    meetings: meetingsAttended,
    trofast: trofast ? 1 : 0,
    recommendations,
    adventDoorsByYear,
    adventFirstTry: solved.filter((r) => r.attemptsUsed === 1).length,
    adventFourthTry: solved.some((r) => r.attemptsUsed === 4) ? 1 : 0,
    adventDoor24: solved.some((r) => dayById.get(id(r.adventDay))?.day === 24) ? 1 : 0,
    adventYears: new Set(adventResults.map((r) => dayById.get(id(r.adventDay))?.year).filter(Boolean)).size,
    sameDay: sameDay ? 1 : 0,
    goalYears,
    wrappedYears: wrappedResponses.filter((r) => r.stepsCompleted?.awards).map((r) => r.year),
    personalities,
  };
}

// ---------------------------------------------------------------- evaluation

// Every badge the member can see, earned or not, with their current value.
// Per-year families expand to one badge per year that has something to
// show (advent: years played; goal/Bokwrapped: years earned).
function evaluateFromMetrics(metrics) {
  const entries = [];
  let order = 0;
  const push = (family, tier, extra) =>
    entries.push({
      family: family.key,
      familyName: family.name,
      color: family.color,
      icon: family.icon,
      secret: !!tier.secret,
      order: order++,
      ...tier,
      ...extra,
    });

  for (const family of BADGE_FAMILIES) {
    if (family.key === "advent") {
      const years = Object.keys(metrics.adventDoorsByYear).map(Number).sort();
      // Show the current year's ladder even before anyone has played
      const thisYear = new Date().getFullYear();
      if (!years.includes(thisYear)) years.push(thisYear);
      for (const year of years) {
        for (const tier of family.tiers) {
          const value = metrics.adventDoorsByYear[year] || 0;
          push(family, tier, {
            key: tier.key.replace("{year}", year),
            year,
            value,
            earned: value >= tier.goal,
            top: tier === family.tiers[family.tiers.length - 1],
          });
        }
      }
      continue;
    }

    if (family.key === "year") {
      const yearList = (metric) => (metric === "goalReached" ? metrics.goalYears : metrics.wrappedYears);
      for (const tier of family.tiers) {
        for (const year of [...new Set(yearList(tier.metric))].sort()) {
          push(family, tier, { key: tier.key.replace("{year}", year), label: String(year), year, value: 1, earned: true });
        }
      }
      for (const [year, p] of Object.entries(metrics.personalities)) {
        push(family, { name: p.label, rule: `Leserpersonlighet i Bokwrapped ${year}`, metric: "personality", goal: 1 }, {
          key: `personality-${year}-${p.key}`,
          label: String(year),
          year: Number(year),
          value: 1,
          earned: true,
        });
      }
      continue;
    }

    family.tiers.forEach((tier, i) => {
      const value = metrics[tier.metric] || 0;
      // Top = the last tier on this metric's ladder (Klubbliv has two ladders)
      const ladder = family.tiers.filter((t) => t.metric === tier.metric);
      const top = ladder.length > 1 && ladder[ladder.length - 1] === tier;
      push(family, tier, { key: tier.key || `${family.key}-${i + 1}`, value, earned: value >= tier.goal, top });
    });
  }
  return entries;
}

async function evaluateBadges(userId) {
  const metrics = await computeMetrics(userId);
  return { metrics, entries: evaluateFromMetrics(metrics) };
}

// ---------------------------------------------------------------- awarding

async function ensureBadge(entry) {
  return Badge.findOneAndUpdate(
    { key: entry.key },
    {
      $set: {
        name: entry.name,
        description: entry.rule,
        icon: entry.icon,
        family: entry.family,
        label: entry.label,
        order: entry.order,
        secret: entry.secret,
        top: !!entry.top,
        year: entry.year || null,
      },
    },
    { upsert: true, new: true },
  );
}

// Idempotent by design: awarding uses upsert-with-$setOnInsert against
// UserBadge's unique (user, badge) index, so calling this again for a user
// who already has the badge is a no-op, not an error. Returns true when the
// badge is new for the user.
async function awardBadge(userId, badgeId) {
  const result = await UserBadge.updateOne(
    { user: userId, badge: badgeId },
    { $setOnInsert: { user: userId, badge: badgeId, awardedAt: new Date() } },
    { upsert: true },
  );
  return result.upsertedCount > 0;
}

// Awards every badge the member has earned and doesn't have yet.
// notify: "each" - one notification per new badge (normal use),
//         "summary" - one "you got N badges" notification (the launch backfill),
//         "none".
async function awardBadgesForUser(userId, { notify = "each", force = false } = {}) {
  if (!force && !(await isBadgesLaunched())) return { newBadges: [] };

  const { entries } = await evaluateBadges(userId);
  const newBadges = [];
  for (const entry of entries.filter((e) => e.earned)) {
    const badge = await ensureBadge(entry);
    if (await awardBadge(userId, badge._id)) newBadges.push(entry);
  }

  if (notify === "each") {
    for (const b of newBadges) {
      await createNotification({
        recipient: userId,
        type: "badge-earned",
        message: `Nytt lesemerke: ${b.name}! 🔖 ${b.rule}.`,
        link: "/merker",
        push: false,
      }).catch((error) => console.error("Badge notification failed:", error));
    }
  } else if (notify === "summary" && newBadges.length) {
    await createNotification({
      recipient: userId,
      type: "badge-earned",
      message:
        newBadges.length === 1
          ? `Du har fått ditt første lesemerke: ${newBadges[0].name}! 🔖`
          : `Du har fått ${newBadges.length} lesemerker! 🔖 Se dem på profilen din.`,
      link: "/merker",
      push: false,
    }).catch((error) => console.error("Badge notification failed:", error));
  }
  return { newBadges };
}

// Fire-and-forget check after something a member did (marked a book read,
// wrote a review, solved a door) - never slows down or fails that request
function queueBadgeCheck(userId) {
  if (!userId) return;
  awardBadgesForUser(userId).catch((error) => console.error("Badge check failed:", error));
}

// Admin/cron: check every approved member. At launch, `notify: "summary"`
// gives each member one notification for everything earned so far.
async function recalculateAllBadges({ notify = "each", force = false } = {}) {
  const users = await User.find({ status: "approved" }).select("_id").lean();
  const results = [];
  for (const user of users) {
    const { newBadges } = await awardBadgesForUser(user._id, { notify, force });
    results.push({ userId: user._id, awarded: newBadges.length });
  }
  return results;
}

// Admin preview before launch: what every member would hold, without
// awarding anything
async function previewAllBadges() {
  const users = await User.find({ status: "approved" }).select("displayName username").lean();
  const rows = [];
  for (const user of users) {
    const { entries } = await evaluateBadges(user._id);
    const earned = entries.filter((e) => e.earned);
    rows.push({
      _id: user._id,
      name: user.displayName || user.username,
      earned: earned.length,
      badges: earned.map((e) => ({ name: e.name, label: e.label, family: e.family, color: e.color, icon: e.icon })),
    });
  }
  return rows.sort((a, b) => b.earned - a.earned);
}

// ---------------------------------------------------------------- advent (existing)

// The advent calendar awards its door-count badges itself, launch switch or
// not - this keeps that behaviour, with names and levels from badgeConfig.
const adventFamily = familyByKey.get("advent");

async function ensureDoorCountBadge(year, threshold) {
  const tier = adventFamily.tiers.find((t) => t.goal === threshold);
  return ensureBadge({
    key: tier ? tier.key.replace("{year}", year) : `advent-doors-${year}-${threshold}`,
    name: tier?.name || "Julekalender",
    rule: tier?.rule || `${threshold} luker løst innen fristen`,
    icon: adventFamily.icon,
    family: adventFamily.key,
    label: String(threshold),
    order: 0,
    secret: false,
    year,
  });
}

// Counts this user's doors solved within the leaderboard deadline for a
// given year, and awards every door-count badge they've now crossed. Safe
// to call after every solved door, or re-run in bulk for the whole year via
// recalculateDoorCountBadgesForYear. Also runs the general badge check, so
// the advent extras (first try, door 24, ...) come right away once launched.
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
  queueBadgeCheck(userId);
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

module.exports = {
  awardDoorCountBadgesForUser,
  recalculateDoorCountBadgesForYear,
  isBadgesLaunched,
  setBadgesLaunched,
  evaluateBadges,
  awardBadgesForUser,
  queueBadgeCheck,
  recalculateAllBadges,
  previewAllBadges,
};
