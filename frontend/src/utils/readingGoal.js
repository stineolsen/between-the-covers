// Shared helper for the reading-goal progress shown on Home and ReadingHistory.
// `userBooks` is the array returned by userBooksApi.getUserBooks({ status: "read" }).
export const countReadInYear = (userBooks, year = new Date().getFullYear()) =>
  (userBooks || []).filter(
    (ub) => ub.finishedAt && new Date(ub.finishedAt).getFullYear() === year,
  ).length;

export const goalProgress = (readCount, goal) => {
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.round((readCount / goal) * 100));
};

// How readCount compares to where a steady, evenly-paced reader would be by
// today's date (e.g. on 1. juli — halfway through the year — a goal of 20
// expects 10 books read so far). Returns null when there's no goal to pace
// against.
export const getPaceStatus = (readCount, goal, now = new Date()) => {
  if (!goal || goal <= 0) return null;
  if (readCount >= goal) return { state: "done", diff: 0 };

  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const startOfNextYear = new Date(year + 1, 0, 1);
  const dayOfYear = Math.floor((now - startOfYear) / 86400000) + 1;
  const totalDays = Math.round((startOfNextYear - startOfYear) / 86400000);

  const expected = (goal * dayOfYear) / totalDays;
  const diff = Math.round(readCount - expected);

  if (diff >= 1) return { state: "ahead", diff };
  if (diff <= -1) return { state: "behind", diff: Math.abs(diff) };
  return { state: "on-track", diff: 0 };
};
