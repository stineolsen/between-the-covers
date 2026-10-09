import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import adventApi from "../../api/adventApi";
import { osloToday } from "../../utils/adventClock";

const today = osloToday();
const inSeason = today.month === 12 && today.day <= 24;

const STATE_COPY = {
  locked: "Åpner kl. 05:00 i dag",
  open: "Åpen - gjett dagens bok",
  solved: "Løst!",
  failed: "Ikke løst denne gangen",
  expired: "Fristen er ute - spill for moro",
};

// Shows only today's door (not the whole calendar) as a compact card, same
// footprint as WrappedBanner - the full 24-door grid lives on its own page
// at /julekalender, reached via this card.
const AdventCalendarBanner = () => {
  const [todaysDoor, setTodaysDoor] = useState(null);

  useEffect(() => {
    if (!inSeason) return;
    adventApi
      .getCalendar(today.year)
      .then((data) => setTodaysDoor((data.days || []).find((d) => d.day === today.day) || null))
      .catch(() => {});
  }, []);

  if (!inSeason || !todaysDoor) return null;

  const copy = STATE_COPY[todaysDoor.state] || STATE_COPY.open;
  const pointsNote = todaysDoor.state === "solved" ? ` - ${todaysDoor.points} poeng` : "";

  return (
    <Link
      to={`/julekalender?day=${today.day}`}
      className="block rounded-2xl p-4 mb-6 animate-fadeIn hover:opacity-95 transition-opacity"
      style={{
        background: "linear-gradient(120deg, var(--color-primary-solid), var(--color-secondary-solid) 150%)",
        color: "#fff6ec",
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-semibold flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.18)", fontFamily: "'Fraunces', serif" }}
        >
          {today.day}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold mb-0.5" style={{ fontFamily: "'Fraunces', serif" }}>
            Julekalender - luke {today.day}
          </h3>
          <p className="text-sm opacity-90">
            {copy}
            {pointsNote}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default AdventCalendarBanner;
