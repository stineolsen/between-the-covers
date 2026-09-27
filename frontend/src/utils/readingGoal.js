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
