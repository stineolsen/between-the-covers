import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import badgesApi from "../api/badgesApi";
import Bookmark from "../components/badges/Bookmark";

const nb = (n) => Number(n || 0).toLocaleString("nb-NO");

const Progress = ({ value, goal, color }) => (
  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-sunken)" }}>
    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (value / goal) * 100)}%`, background: color }} />
  </div>
);

const Tier = ({ badge, family }) => {
  const state = badge.earned ? "earned" : badge.secret ? "secret" : "locked";
  const showProgress = state === "locked" && badge.goal > 1 && badge.value > 0;
  return (
    <div className="flex flex-col items-center text-center gap-1.5">
      <Bookmark
        color={family.color}
        icon={family.icon}
        label={badge.label}
        state={state}
        top={badge.top}
        width={52}
        title={state === "secret" ? "Hemmelig merke" : `${badge.name}: ${badge.rule}${badge.earned ? "" : " (ikke ennå)"}`}
      />
      <span className="text-sm font-semibold leading-tight" style={{ color: badge.earned ? "var(--color-text)" : "var(--color-text-muted)" }}>
        {state === "secret" ? "Hemmelig" : badge.name}
      </span>
      <span className="text-xs leading-snug" style={{ color: "var(--color-text-faint)" }}>
        {state === "secret" ? "Avsløres når du får det" : badge.rule}
      </span>
      {showProgress && (
        <div className="w-16" title={`${nb(badge.value)} av ${nb(badge.goal)}`}>
          <Progress value={badge.value} goal={badge.goal} color={family.color} />
        </div>
      )}
      {badge.earned && badge.awardedAt && (
        <span className="text-[11px]" style={{ color: "var(--color-text-faint)" }}>
          {new Date(badge.awardedAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      )}
    </div>
  );
};

const Badges = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    badgesApi
      .getMyBadges()
      .then(setData)
      .catch(() => setError("Klarte ikke hente lesemerkene. Prøv igjen litt senere."));
  }, []);

  if (error) {
    return <p className="max-w-3xl mx-auto px-4 py-12 text-center" style={{ color: "var(--color-text-muted)" }}>{error}</p>;
  }
  if (!data) {
    return <p className="max-w-3xl mx-auto px-4 py-12 text-center" style={{ color: "var(--color-text-muted)" }}>Henter lesemerkene…</p>;
  }

  if (!data.launched && !data.preview) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="flex justify-center gap-2 mb-6" aria-hidden="true">
          <Bookmark color="#2f7a50" icon="book" label="?" width={44} />
          <Bookmark color="#1e7a93" icon="headphones" label="?" width={44} />
          <Bookmark color="#b5182f" icon="gift" label="?" width={44} />
        </div>
        <h1 className="text-3xl font-semibold mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
          Lesemerker kommer snart
        </h1>
        <p style={{ color: "var(--color-text-muted)" }}>Følg med, det blir noe å samle på.</p>
        <Link to="/profile" className="inline-block mt-8 text-sm font-bold" style={{ color: "var(--color-primary)" }}>
          ← Tilbake til profilen
        </Link>
      </div>
    );
  }

  const familyByKey = new Map(data.families.map((f) => [f.key, f]));
  const earned = data.badges.filter((b) => b.earned);

  // Closest next: one per family, the locked level with the most progress
  const seen = new Set();
  const next = data.badges
    .filter((b) => !b.earned && !b.secret && b.goal > 1 && b.value > 0)
    .sort((a, b) => b.value / b.goal - a.value / a.goal)
    .filter((b) => (seen.has(b.family) ? false : seen.add(b.family)))
    .slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {data.preview && (
        <div className="rounded-2xl p-4 mb-6 text-sm" style={{ background: "var(--color-gold-tint)", color: "var(--color-secondary)" }} role="status">
          <b>Forhåndsvisning for admin.</b> Lesemerker er ikke lansert, så medlemmene ser bare «kommer snart». Dette er merkene du
          ville hatt i dag.
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-5xl font-bold gradient-text mb-2">Lesemerker</h1>
          <p style={{ color: "var(--color-text-muted)" }}>
            Du har <b style={{ color: "var(--color-text)" }}>{earned.length}</b> av {data.badges.length} merker.
          </p>
        </div>
        <Link to="/profile" className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
          ← Profilen
        </Link>
      </div>

      {next.length > 0 && (
        <section className="container-gradient mb-6" aria-labelledby="next-title">
          <h2 id="next-title" className="text-xl font-bold gradient-text mb-4">Nærmest neste merke</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {next.map((b) => {
              const family = familyByKey.get(b.family);
              return (
                <div key={b.key} className="flex items-center gap-3">
                  <Bookmark color={family.color} icon={family.icon} label={b.label} state="locked" width={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2 text-sm">
                      <b className="truncate">{b.name}</b>
                      <span className="tabular-nums" style={{ color: "var(--color-text-faint)" }}>
                        {nb(b.value)} / {nb(b.goal)}
                      </span>
                    </div>
                    <div className="mt-1">
                      <Progress value={b.value} goal={b.goal} color={family.color} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-5">
        {data.families.map((family) => {
          const badges = data.badges.filter((b) => b.family === family.key);
          if (badges.length === 0 && family.key === "year") return null;
          const familyEarned = badges.filter((b) => b.earned).length;
          // Per-year families are grouped by year, newest first
          const years = family.perYear ? [...new Set(badges.map((b) => b.year))].sort((a, b) => b - a) : [null];

          return (
            <section key={family.key} className="card p-6" aria-labelledby={`family-${family.key}`}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                <span className="w-3.5 h-3.5 rounded" style={{ background: family.color }} aria-hidden="true" />
                <h2 id={`family-${family.key}`} className="text-xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
                  {family.name}
                </h2>
                <span className="ml-auto text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                  {familyEarned} av {badges.length}
                </span>
              </div>
              <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>
                {family.description}
              </p>
              {years.map((year) => (
                <div key={year ?? "all"} className="mb-4 last:mb-0">
                  {year && family.key !== "year" && (
                    <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--color-text-faint)" }}>
                      {year}
                    </p>
                  )}
                  <div className="grid gap-x-3 gap-y-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))" }}>
                    {badges
                      .filter((b) => year === null || b.year === year)
                      .map((b) => (
                        <Tier key={b.key} badge={b} family={family} />
                      ))}
                  </div>
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default Badges;
