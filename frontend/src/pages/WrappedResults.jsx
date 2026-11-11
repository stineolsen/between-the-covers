import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import wrappedApi from "../api/wrappedApi";
import { useAuth } from "../contexts/useAuth";
import StoryPlayer from "../components/wrapped/results/StoryPlayer";
import { buildSlides } from "../components/wrapped/results/buildSlides";
import { formatReleaseDate, useCountdown } from "../utils/wrappedYear";

const Countdown = ({ year, releaseAt }) => {
  const left = useCountdown(releaseAt);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <img src="/logo_cropped.png" alt="Between the Covers" className="w-32 mx-auto mb-6" />
      <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--color-text-faint)" }}>
        BTC Bokwrapped {year}
      </p>
      <h1 className="text-3xl font-semibold mb-3" style={{ fontFamily: "'Fraunces', serif" }}>
        {releaseAt ? "Snart klart! 🎁" : "Bokwrapped er ikke klart ennå"}
      </h1>
      {releaseAt && left ? (
        <>
          <p className="mb-8" style={{ color: "var(--color-text-muted)" }}>
            Oppsummeringen slippes {formatReleaseDate(releaseAt)}.
          </p>
          <div className="flex justify-center gap-3" role="timer" aria-live="off">
            {[
              [left.days, "dager"],
              [left.hours, "timer"],
              [left.minutes, "min"],
              [left.seconds, "sek"],
            ].map(([value, label]) => (
              <div key={label} className="card rounded-2xl w-20 py-4">
                <p className="text-3xl font-bold" style={{ fontFamily: "'Fraunces', serif", color: "var(--color-primary)" }}>
                  {String(value).padStart(2, "0")}
                </p>
                <p className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-faint)" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p style={{ color: "var(--color-text-muted)" }}>
          {releaseAt ? "Den er ute nå - last inn siden på nytt!" : "Admin har ikke satt en slippdato ennå. Følg med!"}
        </p>
      )}
      <Link to="/" className="inline-block mt-10 text-sm font-bold" style={{ color: "var(--color-primary)" }}>
        ← Tilbake til forsiden
      </Link>
    </div>
  );
};

const WrappedResults = () => {
  const { year: yearParam } = useParams();
  const year = Number(yearParam);
  const [searchParams] = useSearchParams();
  const previewUser = searchParams.get("user");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [locked, setLocked] = useState(null); // { releaseAt } when not released
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    wrappedApi
      .getResults(year, previewUser)
      .then(setData)
      .catch((err) => {
        if (err.response?.status === 403) setLocked({ releaseAt: err.response.data?.releaseAt });
        else setError("Klarte ikke hente Bokwrapped. Prøv igjen litt senere.");
      });
  }, [year, previewUser]);

  const name = data?.personal?.user?.displayName || data?.personal?.user?.username || user?.displayName || user?.username || "leser";
  const slides = useMemo(() => (data ? buildSlides({ data, name }) : []), [data, name]);

  if (locked) return <Countdown year={year} releaseAt={locked.releaseAt} />;

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p style={{ color: "var(--color-text-muted)" }}>{error}</p>
        <Link to="/" className="inline-block mt-6 text-sm font-bold" style={{ color: "var(--color-primary)" }}>
          ← Tilbake til forsiden
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl animate-bounce mb-4" aria-hidden="true">
          🎁
        </div>
        <p style={{ color: "var(--color-text-muted)" }}>Pakker opp leseåret ditt …</p>
      </div>
    );
  }

  // Before the year is over the numbers are still moving
  const provisional = year >= new Date().getFullYear();
  const badge = !data.released ? `Forhåndsvisning${provisional ? " · foreløpige tall" : ""}` : `Bokwrapped ${year}`;
  return <StoryPlayer slides={slides} onClose={() => navigate("/")} badge={badge} />;
};

export default WrappedResults;
