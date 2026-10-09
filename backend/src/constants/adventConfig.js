// Tunable numbers for the "gjett boka" advent calendar, kept in one place
// per the design doc's "lett å endre" requirement.
module.exports = {
  MAX_ATTEMPTS: 4,
  POINTS_BY_ATTEMPT: { 1: 4, 2: 3, 3: 2, 4: 1 },
  // A door opened on day N must be solved by 23:59:59 N+2 days later (Oslo
  // time) to count for the leaderboard - see calendarClock.doorDeadline.
  LEADERBOARD_DEADLINE_DAYS_AFTER_OPEN: 2,
  // Door-count thresholds that earn a badge - solved within the leaderboard
  // deadline only.
  DOOR_COUNT_BADGE_THRESHOLDS: [5, 12, 18, 24],
};
