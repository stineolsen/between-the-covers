// Reading plan maths - pure functions, no React. Days are whole calendar
// days in the viewer's time zone, and the target day counts as a reading
// day ("finished by the 15th" means you still read on the 15th).

const DAY_MS = 24 * 60 * 60 * 1000;

export const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

// Calendar days from a to b (b - a), ignoring time of day and DST shifts
export const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);

export const addDays = (d, n) => {
  const x = startOfDay(d);
  x.setDate(x.getDate() + n);
  return x;
};

// "YYYY-MM-DD" for <input type="date">, in local time
export const toDateInput = (d) => {
  const x = new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};

export const percentOf = (page, total) => (total ? Math.min(100, Math.round((page / total) * 100)) : 0);

/**
 * Where you stand against a plan to finish `total` pages by `targetDate`.
 * Today's goal is recalculated from where you actually are, so falling
 * behind spreads the catch-up over the days left rather than piling it on
 * one day. "Ahead/behind" compares against the original, even pace from
 * the day the plan was made (plan.startPage on plan.startDate).
 */
export function planStatus({ total, currentPage, plan, today = new Date() }) {
  const remaining = Math.max(0, total - currentPage);
  const daysLeft = daysBetween(today, plan.targetDate) + 1; // today included
  const overdue = daysLeft < 1;

  const pagesPerDay = remaining === 0 ? 0 : overdue ? remaining : Math.ceil(remaining / daysLeft);
  const todayGoalPage = Math.min(total, currentPage + pagesPerDay);

  // Original pace: by the start of today you "should" have been at this page
  const planDays = Math.max(1, daysBetween(plan.startDate, plan.targetDate) + 1);
  const daysDone = Math.min(planDays, Math.max(0, daysBetween(plan.startDate, today)));
  const expectedPage = Math.round(plan.startPage + ((total - plan.startPage) * daysDone) / planDays);
  const aheadBy = currentPage - expectedPage; // > 0 ahead, < 0 behind

  return { remaining, daysLeft: Math.max(0, daysLeft), overdue, pagesPerDay, todayGoalPage, expectedPage, aheadBy, done: remaining === 0 };
}

/**
 * Day-by-day "read to page N" list from today to the target date, spreading
 * the remaining pages as evenly as possible (earlier days get the extra page
 * when it doesn't divide evenly).
 */
export function planSchedule({ total, currentPage, targetDate, today = new Date() }) {
  const days = daysBetween(today, targetDate) + 1;
  const remaining = Math.max(0, total - currentPage);
  if (days < 1 || remaining === 0) return [];
  const base = Math.floor(remaining / days);
  const extra = remaining % days;
  const rows = [];
  let page = currentPage;
  for (let i = 0; i < days; i++) {
    const pages = base + (i < extra ? 1 : 0);
    page += pages;
    rows.push({ date: addDays(today, i), pages, toPage: page });
  }
  return rows;
}

/** Preview for a not-yet-saved target date: pages per day and days. */
export function previewPlan({ total, currentPage, targetDate, today = new Date() }) {
  const days = daysBetween(today, targetDate) + 1;
  const remaining = Math.max(0, total - currentPage);
  if (days < 1) return null;
  return { days, remaining, pagesPerDay: Math.ceil(remaining / days) };
}
