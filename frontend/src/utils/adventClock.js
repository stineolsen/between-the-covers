// Client-side mirror of the backend's calendarClock.js override, for local
// preview only - lets the UI reflect a fake December date without waiting
// for the real one. Only ever active in a dev build (import.meta.env.DEV is
// stripped out of production bundles), so this can never affect production.
export function now() {
  if (import.meta.env.DEV && import.meta.env.VITE_CALENDAR_FAKE_NOW) {
    return new Date(import.meta.env.VITE_CALENDAR_FAKE_NOW);
  }
  return new Date();
}

export function osloToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) };
}
