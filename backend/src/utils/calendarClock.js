// Single source of truth for "now" across the advent calendar feature. All
// door/deadline comparisons must go through this instead of `new Date()`
// directly, so tests (and manual QA in December) can pin the clock via
// CALENDAR_FAKE_NOW without touching the system clock. The override only
// works outside production so it can never affect real players.
function now() {
  if (process.env.NODE_ENV !== "production" && process.env.CALENDAR_FAKE_NOW) {
    return new Date(process.env.CALENDAR_FAKE_NOW);
  }
  return new Date();
}

// Oslo is UTC+1 in December (no DST in winter), so a door opening "5. des
// kl. 05:00" is 04:00 UTC. Rather than pull in a timezone library for this
// one fixed offset, build the UTC instant directly - this is only valid for
// dates in the Nov-Feb range the calendar actually runs in.
const OSLO_WINTER_OFFSET_HOURS = 1;

function osloDateTime(year, month, day, hour, minute, second) {
  return new Date(Date.UTC(year, month - 1, day, hour - OSLO_WINTER_OFFSET_HOURS, minute, second));
}

function doorOpensAt(year, day) {
  return osloDateTime(year, 12, day, 5, 0, 0);
}

function doorDeadline(year, day, deadlineDaysAfterOpen) {
  const opens = doorOpensAt(year, day);
  const deadline = new Date(opens);
  deadline.setUTCDate(deadline.getUTCDate() + deadlineDaysAfterOpen);
  deadline.setUTCHours(23 - OSLO_WINTER_OFFSET_HOURS, 59, 59, 999);
  return deadline;
}

module.exports = { now, osloDateTime, doorOpensAt, doorDeadline };
