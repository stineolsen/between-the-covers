import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import wrappedApi from "../../api/wrappedApi";
import { useAuth } from "../../contexts/useAuth";
import { adminWrappedYear, resultsYear } from "../../utils/wrappedYear";
import WrappedMiniCard from "../wrapped/WrappedMiniCard";

// Homepage row(s) of the Bokwrapped summaries members have chosen to share
// from the last slide of their results story. Hidden until someone shares.
// Admins also get the year they're previewing, so a preview share shows up
// here exactly as it will on release day (the backend returns nothing for
// an unreleased year to everyone else).
const ClubWrappedRow = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const years = [...new Set([resultsYear(), ...(isAdmin ? [adminWrappedYear()] : [])])];
    Promise.all(
      years.map((year) =>
        wrappedApi
          .getYearShares(year)
          .then((data) => ({ year, released: data.released, shares: data.shares || [] }))
          .catch(() => ({ year, shares: [] })),
      ),
    ).then((results) => setRows(results.filter((r) => r.shares.length > 0).sort((a, b) => b.year - a.year)));
  }, [isAdmin]);

  return rows.map(({ year, released, shares }) => (
    <section key={year} className="mb-6 animate-fadeIn" aria-labelledby={`club-wrapped-${year}`}>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2
          id={`club-wrapped-${year}`}
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: "var(--color-text-faint)" }}
        >
          Klubbens Bokwrapped {year} · {shares.length}
          {released === false && (
            <span className="ml-2 normal-case tracking-normal font-semibold" style={{ color: "var(--color-primary)" }}>
              (forhåndsvisning – bare admin ser dette)
            </span>
          )}
        </h2>
        <Link
          to={`/bokwrapped/${year}/resultat`}
          className="text-xs font-bold flex-shrink-0"
          style={{ color: "var(--color-primary)" }}
        >
          Se din egen →
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {shares.map((share) => (
          <WrappedMiniCard
            key={share._id}
            share={{ ...share, released }}
            showUser
            className="snap-start flex-shrink-0 w-[min(18rem,80vw)]"
          />
        ))}
      </div>
    </section>
  ));
};

export default ClubWrappedRow;
