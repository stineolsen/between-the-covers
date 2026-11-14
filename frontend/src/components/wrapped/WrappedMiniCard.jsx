import { Link } from "react-router-dom";
import UserAvatar from "../common/UserAvatar";
import { Cover, THEMES, dec, nb } from "./results/slideParts";

const theme = THEMES.wine;

// The "minimised" Bokwrapped a member has shared with the club: the summary
// slide's numbers, personality, their three favourite books and a few
// highlights vs the club - small enough to sit on a profile or in a row on
// the homepage. Fixed poster colours like the story
// itself, so it reads as "the same thing" in light and dark mode.
//
// share: { user, year, snapshot } from /api/wrapped/.../shares
// showUser: show avatar + name (homepage row); linkUser makes it a profile link
// onRemove: owner-only "stop sharing" action
const WrappedMiniCard = ({ share, showUser = false, linkUser = true, onRemove, className = "" }) => {
  const { user, year, snapshot: s } = share;
  const name = user?.displayName || user?.username || "Medlem";

  const who = (
    <>
      <UserAvatar user={user} className="w-8 h-8 rounded-full flex-shrink-0" />
      <span className="font-semibold truncate" style={{ fontFamily: "'Fraunces', serif" }}>
        {name}
      </span>
    </>
  );

  // Only lines with something to say are shown
  const goal = s.readingGoal;
  const club = s.bookclub;
  const highlights = [
    s.bestPercentile && ["🏅", `Topp ${s.bestPercentile.topPercent} % i klubben på ${s.bestPercentile.label}`],
    goal && [
      "🎯",
      goal.count >= goal.goal
        ? `${nb(goal.count)} av ${nb(goal.goal)} bøker – målet nådd!`
        : `${nb(goal.count)} av ${nb(goal.goal)} bøker på lesemålet`,
    ],
    club && [
      "📚",
      `${club.read} av ${club.total} bokklubbøker${club.meetingsTotal > 0 ? ` · ${club.meetingsAttended} av ${club.meetingsTotal} møter` : ""}`,
    ],
  ].filter(Boolean);

  const stats = [
    [nb(s.count), s.count === 1 ? "bok" : "bøker"],
    [nb(s.pages), "sider"],
    [s.avgRating != null ? `${dec(s.avgRating)}★` : "–", "snitt"],
    [s.topGenre || "–", "toppsjanger"],
  ];

  return (
    <article
      className={`rounded-2xl p-4 shadow-md flex flex-col gap-3 ${className}`}
      style={{ background: theme.bg, color: theme.fg }}
      aria-label={`${name}s Bokwrapped ${year}`}
    >
      <header className="flex items-center gap-2 min-w-0">
        {showUser ? (
          linkUser ? (
            <Link to={`/members/${user._id}`} className="flex items-center gap-2 min-w-0 hover:opacity-90">
              {who}
            </Link>
          ) : (
            <div className="flex items-center gap-2 min-w-0">{who}</div>
          )
        ) : (
          <img src="/logo_cropped.png" alt="" className="h-6 w-auto flex-shrink-0" />
        )}
        <span
          className="ml-auto text-[10px] font-bold uppercase tracking-[0.14em] flex-shrink-0"
          style={{ color: theme.muted }}
        >
          {share.released === false ? "Forhåndsvisning · " : ""}Bokwrapped {year}
        </span>
      </header>

      <div className="grid grid-cols-4 gap-1.5 text-center">
        {stats.map(([value, label]) => (
          <div key={label} className="rounded-lg px-1 py-2 min-w-0" style={{ background: "rgba(255,255,255,0.1)" }}>
            <p
              className="text-sm font-bold truncate"
              style={{ fontFamily: "'Fraunces', serif", color: theme.accent }}
              title={value}
            >
              {value}
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-wide truncate" style={{ color: theme.muted }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {s.personalities?.length > 0 && (
        <p className="text-sm font-semibold leading-snug" style={{ fontFamily: "'Fraunces', serif" }}>
          {s.personalities.map((p) => `${p.emoji} ${p.label}`).join(" · ")}
        </p>
      )}

      {s.favorites?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: theme.muted }}>
            Årets favoritter
          </p>
          <div className="grid grid-cols-3 gap-2">
            {s.favorites.map((f, i) => (
              <div key={`${f.bookId}-${i}`} className="min-w-0 flex flex-col items-center" title={f.title}>
                <Cover book={{ title: f.title, coverImage: f.coverImage }} className="w-full max-w-[4.5rem] !rounded-[4px] !shadow-md" />
                <p className="mt-1 text-xs font-bold" style={{ color: theme.accent }}>
                  {f.rating != null ? `${dec(f.rating)}★` : "\u00a0"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {highlights.length > 0 && (
        <ul className="space-y-1 text-xs leading-snug">
          {highlights.map(([icon, text]) => (
            <li key={icon} className="flex gap-2">
              <span aria-hidden="true">{icon}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="self-start text-xs font-bold underline underline-offset-2 hover:opacity-80"
          style={{ color: theme.muted }}
        >
          Fjern fra profilen
        </button>
      )}
    </article>
  );
};

export default WrappedMiniCard;
