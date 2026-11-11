import { useEffect, useState } from "react";

// Which year's Bokwrapped results are "current": December belongs to the
// year being wrapped up (collection + countdown), January-November to the
// previous year (release in early January, then it stays viewable).
export const resultsYear = (now = new Date()) =>
  now.getMonth() === 11 ? now.getFullYear() : now.getFullYear() - 1;

// The year an admin is working on: the current, still-running year (to
// preview the provisional wrapped), except in January-February while last
// year's results are being released.
export const adminWrappedYear = (now = new Date()) =>
  now.getMonth() <= 1 ? now.getFullYear() - 1 : now.getFullYear();

// Ticking countdown to `target` (Date or ISO string) - null when passed
export function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return null;
  const ms = new Date(target).getTime() - now;
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export const formatReleaseDate = (date) =>
  new Date(date).toLocaleString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
