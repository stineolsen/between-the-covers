import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { useToast } from "../contexts/useToast";
import adventApi from "../api/adventApi";
import badgesApi from "../api/badgesApi";
import { osloToday } from "../utils/adventClock";

const year = osloToday().year;

const STATE_LABEL = {
  locked: "Låst",
  open: "Åpen",
  solved: "Løst",
  failed: "Mislykket",
  expired: "Frist ute",
};

const RESULT_COLOR = {
  correct: "var(--color-sage)",
  author: "var(--color-secondary-deep)",
  wrong: "var(--color-terracotta)",
};

function formatDeadline(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("nb-NO", { day: "numeric", month: "long" }) +
    " kl. " +
    new Date(iso).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
}

const DoorTile = ({ door, active, onClick }) => {
  const stateStyles = {
    locked: { background: "var(--color-sunken)", borderStyle: "dashed", color: "var(--color-text-faint)" },
    open: { borderColor: "var(--color-secondary-deep)", boxShadow: "0 0 0 2px var(--color-gold-tint) inset" },
    solved: { background: "var(--color-sage-tint)", borderColor: "var(--color-sage)" },
    failed: { background: "var(--color-terracotta-tint)", borderColor: "var(--color-terracotta)" },
    expired: { background: "var(--color-card)", borderStyle: "dashed", opacity: 0.85 },
  };

  return (
    <button
      onClick={onClick}
      className="aspect-[3/4] rounded-xl p-2 flex flex-col justify-between text-left transition-transform hover:-translate-y-0.5"
      style={{
        border: "1px solid var(--color-border)",
        outline: active ? "2px solid var(--color-primary)" : "none",
        outlineOffset: "2px",
        ...stateStyles[door.state],
      }}
    >
      <span className="text-xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
        {door.day}
      </span>
      <span className="text-[0.62rem] font-bold leading-tight" style={{ color: "var(--color-text-faint)" }}>
        {door.state === "solved" && `+${door.points}p`}
        {door.state === "failed" && "0p"}
        {door.state === "open" && (door.attemptsUsed > 0 ? `${door.attemptsUsed}/4 brukt` : "Ikke startet")}
        {door.state === "expired" && "Frist ute"}
        {door.state === "locked" && "Låst"}
      </span>
    </button>
  );
};

const GuessBox = ({ onPick, disabled }) => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  const handleChange = (e) => {
    const value = e.target.value;
    setQ(value);
    setOpen(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      adventApi
        .search(value)
        .then((data) => setResults(data.results || []))
        .catch(() => setResults([]));
    }, 200);
  };

  return (
    <div className="relative mb-3">
      <input
        type="text"
        className="input-field"
        placeholder="Søk tittel eller forfatter ..."
        value={q}
        disabled={disabled}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div
          className="absolute left-0 right-0 mt-1 rounded-lg overflow-hidden z-10 max-h-56 overflow-y-auto"
          style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", boxShadow: "0 10px 24px rgba(0,0,0,0.14)" }}
        >
          {results.map((b) => (
            <button
              key={b._id}
              className="block w-full text-left px-3 py-2 text-sm hover:opacity-80"
              style={{ borderBottom: "1px solid var(--color-border)" }}
              onMouseDown={() => {
                setQ(b.title);
                setOpen(false);
                onPick(b);
              }}
            >
              <span className="block font-semibold">{b.title}</span>
              <span className="block text-xs" style={{ color: "var(--color-text-faint)" }}>{b.author}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DayPanel = ({ detail, loading, onAttempt, submitting }) => {
  const [imgUrl, setImgUrl] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    if (!detail) return;
    let revoked = false;
    let currentUrl = null;
    adventApi
      .getImageBlobUrl(detail.year, detail.day, detail.imageLevel)
      .then((url) => {
        if (revoked) {
          URL.revokeObjectURL(url);
          return;
        }
        currentUrl = url;
        setImgUrl(url);
      })
      .catch(() => {});
    return () => {
      revoked = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.day, detail?.imageLevel]);

  if (loading) return <p style={{ color: "var(--color-text-muted)" }}>Laster luke...</p>;
  if (!detail) return null;

  const finished = detail.status !== "in_progress";
  const revealed = finished || detail.deadlinePassed;
  const squares = [...detail.attempts];
  while (squares.length < 4) squares.push(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-6">
      <div>
        <div className="relative rounded-lg overflow-hidden aspect-[2/2.8]" style={{ border: "1px solid var(--color-border)", background: "var(--color-sunken)" }}>
          {imgUrl && <img src={imgUrl} alt="" className="w-full h-full object-cover" />}
          {revealed && (
            <div className="absolute inset-0 flex flex-col justify-end p-3 text-center" style={{ background: "linear-gradient(transparent 40%, rgba(0,0,0,0.65))" }}>
              <p className="font-semibold text-white" style={{ fontFamily: "'Fraunces', serif" }}>{detail.title}</p>
              <p className="text-xs text-white opacity-90">{detail.author}</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2 mb-1">
          <h3 className="text-lg font-semibold">Luke {detail.day}</h3>
          <span className="text-[0.65rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "var(--color-sunken)", color: "var(--color-text-muted)" }}>
            {STATE_LABEL[finished ? detail.status : detail.deadlinePassed ? "expired" : "open"]}
          </span>
        </div>
        {!finished && !detail.deadlinePassed && (
          <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>Frist: {formatDeadline(detail.deadline)}</p>
        )}
        {finished && (
          <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
            {detail.status === "solved" ? `Løst - ${detail.points} poeng.` : "Ikke løst - 0 poeng."}
            {detail.libraryAvailable && " Boken er nå i biblioteket."}
          </p>
        )}
        {!finished && detail.deadlinePassed && (
          <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>Fristen er ute - kan spilles for moro, uten poeng.</p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {detail.genre && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-sunken)", border: "1px solid var(--color-border)" }}>{detail.genre}</span>}
          {detail.publishedYear && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-sunken)", border: "1px solid var(--color-border)" }}>Utgitt {detail.publishedYear}</span>}
          {detail.pageCount && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-sunken)", border: "1px solid var(--color-border)" }}>{detail.pageCount}</span>}
        </div>

        {detail.hints.length > 0 && (
          <ul className="flex flex-col gap-1 mb-3 text-sm">
            {detail.hints.map((h, i) => (
              <li key={i}>- {h}</li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-1.5 mb-4">
          {squares.map((a, i) => (
            <span
              key={i}
              className="w-6 h-6 rounded-md"
              style={{
                background: a ? RESULT_COLOR[a.result] : "var(--color-sunken)",
                border: a ? "none" : "1px dashed var(--color-border-strong)",
              }}
            />
          ))}
          {!finished && !detail.deadlinePassed && (
            <span className="text-xs ml-1" style={{ color: "var(--color-text-faint)" }}>{detail.attemptsRemaining} forsøk igjen</span>
          )}
        </div>

        {!finished && (
          <>
            <GuessBox onPick={setSelectedBook} disabled={submitting} />
            <div className="flex gap-2">
              <button
                className="btn-primary text-sm"
                disabled={!selectedBook || submitting}
                onClick={() => onAttempt({ action: "guess", bookId: selectedBook?._id })}
              >
                Gjett
              </button>
              <button className="btn-secondary text-sm" disabled={submitting} onClick={() => onAttempt({ action: "skip" })}>
                Hopp over
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const AdventCalendar = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [calendar, setCalendar] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [activeDay, setActiveDay] = useState(() => {
    const d = Number(searchParams.get("day"));
    return d >= 1 && d <= 24 ? d : null;
  });
  const [dayDetail, setDayDetail] = useState(null);
  // Derived rather than its own state: dayDetail lags activeDay by one fetch
  // whenever the door changes, and that gap IS "loading" - no need for a
  // separate flag that could drift out of sync with it.
  const dayLoading = activeDay !== null && dayDetail?.day !== activeDay;
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [badges, setBadges] = useState([]);
  const [tab, setTab] = useState("calendar");

  const loadCalendar = useCallback(() => {
    adventApi
      .getCalendar(year)
      .then((data) => setCalendar(data.days || []))
      .catch(() => toast.error("Klarte ikke hente kalenderen"))
      .finally(() => setLoadingCalendar(false));
  }, [toast]);

  useEffect(() => {
    loadCalendar();
    adventApi.getLeaderboard(year).then((data) => setLeaderboard(data.leaderboard || [])).catch(() => {});
    if (user?._id) badgesApi.getUserBadges(user._id).then((data) => setBadges(data.badges || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDay = useCallback(
    (day) => {
      adventApi
        .getDay(year, day)
        .then(setDayDetail)
        .catch(() => toast.error("Klarte ikke hente luken"));
    },
    [toast],
  );

  useEffect(() => {
    if (activeDay) loadDay(activeDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDay]);

  const openDoor = (door) => {
    if (door.state === "locked") {
      const time = new Date(door.opensAt).toLocaleString("nb-NO", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
      toast.error(`Luke ${door.day} åpner ${time}`);
      return;
    }
    setActiveDay(door.day);
    setSearchParams({ day: String(door.day) });
  };

  const handleAttempt = ({ action, bookId }) => {
    setSubmitting(true);
    adventApi
      .submitAttempt(year, activeDay, { action, bookId })
      .then((data) => {
        const messages = { correct: "Riktig!", author: "Riktig forfatter, feil bok.", wrong: "Feil bok." };
        toast[data.result === "correct" ? "success" : "error"](messages[data.result] || "Forsøk registrert");
        loadDay(activeDay);
        loadCalendar();
      })
      .catch((err) => toast.error(err.response?.data?.message || "Klarte ikke registrere forsøket"))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link
        to="/"
        className="inline-block mb-4 text-sm font-semibold"
        style={{ color: "var(--color-primary)" }}
      >
        ← Tilbake til forsiden
      </Link>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-faint)" }}>
          BTC Julekalender {year}
        </p>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
          Gjett boka
        </h1>
      </div>

      <div className="flex gap-1 mb-5" style={{ borderBottom: "1px solid var(--color-border)" }}>
        {[
          ["calendar", "Kalender"],
          ["leaderboard", "Resultatliste"],
          ["badges", "Badges"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="text-sm font-bold px-1 pb-2 mr-4"
            style={{
              color: tab === key ? "var(--color-primary)" : "var(--color-text-muted)",
              borderBottom: tab === key ? "2px solid var(--color-primary)" : "2px solid transparent",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "calendar" && (
        <>
          {loadingCalendar ? (
            <p style={{ color: "var(--color-text-muted)" }}>Laster...</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-6">
              {calendar.map((door) => (
                <DoorTile key={door.day} door={door} active={activeDay === door.day} onClick={() => openDoor(door)} />
              ))}
            </div>
          )}

          {activeDay && (
            <div className="card rounded-2xl p-5">
              <DayPanel key={activeDay} detail={dayLoading ? null : dayDetail} loading={dayLoading} onAttempt={handleAttempt} submitting={submitting} />
            </div>
          )}
        </>
      )}

      {tab === "leaderboard" && (
        <div className="card rounded-2xl p-5 overflow-x-auto">
          <table className="w-full text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr style={{ color: "var(--color-text-faint)" }}>
                <th className="text-left pb-2">#</th>
                <th className="text-left pb-2">Medlem</th>
                <th className="text-left pb-2">Poeng</th>
                <th className="text-left pb-2">Løst</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row) => (
                <tr key={row.user._id} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td className="py-2">#{row.rank}</td>
                  <td className="py-2">{row.user.displayName || row.user.username}</td>
                  <td className="py-2">{row.points}</td>
                  <td className="py-2">{row.solved}/24</td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center" style={{ color: "var(--color-text-faint)" }}>
                    Ingen har løst en luke innen fristen ennå.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "badges" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((badge) => (
            <div key={badge._id} className="card rounded-xl p-4 text-center">
              <p className="font-bold text-sm mb-1">{badge.name}</p>
              <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>{badge.description}</p>
            </div>
          ))}
          {badges.length === 0 && <p style={{ color: "var(--color-text-faint)" }}>Ingen badges ennå.</p>}
        </div>
      )}
    </div>
  );
};

export default AdventCalendar;
