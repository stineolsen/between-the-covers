import { useEffect, useState } from "react";
import wrappedApi from "../../api/wrappedApi";

const nb = (n) => Number(n || 0).toLocaleString("nb-NO");

// "Does this look right?" - the headline numbers Bokwrapped will be built
// from, computed fresh from the member's current list, before they submit.
const WrappedPreview = ({ year, onEditList }) => {
  const [stats, setStats] = useState(undefined);

  useEffect(() => {
    wrappedApi
      .getLive(year)
      .then((data) => setStats(data.stats))
      .catch(() => setStats(null));
  }, [year]);

  if (stats === undefined) {
    return (
      <p className="text-sm mb-4" style={{ color: "var(--color-text-faint)" }}>
        Henter forhåndsvisning…
      </p>
    );
  }
  if (!stats) return null;

  // Deliberately only the bookkeeping numbers - the rest is saved for release day
  const facts = [
    [nb(stats.count), stats.count === 1 ? "bok lest" : "bøker lest"],
    [`${nb(stats.ratingCount)} av ${nb(stats.count)}`, "bøker har stjerner"],
    stats.bookclub.total > 0
      ? [`${stats.bookclub.read} av ${stats.bookclub.total}`, "bokklubbøker lest"]
      : null,
  ].filter(Boolean);

  return (
    <div className="rounded-2xl p-4 mb-5" style={{ border: "2px solid var(--color-primary)" }}>
      <h4 className="font-semibold mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
        🔎 Ser dette riktig ut?
      </h4>
      <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
        Dette er grunnlaget Bokwrapped {year} blir laget av akkurat nå. Resten får du se på slippdagen 🎁
      </p>
      <div className="grid grid-cols-3 gap-2">
        {facts.map(([value, label]) => (
          <div key={label} className="rounded-xl p-2.5" style={{ background: "var(--color-sunken)" }}>
            <p className="font-semibold truncate" style={{ fontFamily: "'Fraunces', serif", color: "var(--color-primary)" }}>
              {value}
            </p>
            <p className="text-[11px]" style={{ color: "var(--color-text-faint)" }}>
              {label}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs mt-3" style={{ color: "var(--color-text-muted)" }}>
        Noe som ikke stemmer?{" "}
        <button onClick={onEditList} className="font-bold" style={{ color: "var(--color-primary)" }}>
          Gå tilbake til leselisten →
        </button>
      </p>
    </div>
  );
};

export default WrappedPreview;
