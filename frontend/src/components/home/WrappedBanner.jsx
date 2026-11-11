import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import wrappedApi from "../../api/wrappedApi";
import { formatReleaseDate, resultsYear, useCountdown } from "../../utils/wrappedYear";

const year = new Date().getFullYear();
const releasedYear = resultsYear();
// How long the "your Bokwrapped is here" banner stays up after release
const SHOW_RELEASED_DAYS = 60;

const bannerStyle = (gradient) => ({ background: gradient, color: "#fff6ec" });

// Release countdown / "it's here" banner for the results
const ReleaseBanner = ({ release }) => {
  const left = useCountdown(release.releaseAt);
  const link = `/bokwrapped/${releasedYear}/resultat`;

  if (left) {
    return (
      <Link
        to={link}
        className="block rounded-2xl p-4 mb-6 animate-fadeIn hover:opacity-95 transition-opacity"
        style={bannerStyle("linear-gradient(120deg, #3a2c2f, var(--color-primary-solid) 160%)")}
      >
        <div className="flex items-center gap-4">
          <div className="text-3xl flex-shrink-0">⏳</div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold mb-0.5" style={{ fontFamily: "'Fraunces', serif" }}>
              Bokwrapped {releasedYear} slippes snart!
            </h3>
            <p className="text-sm opacity-90">{formatReleaseDate(release.releaseAt)}</p>
          </div>
          <div className="text-right flex-shrink-0 font-semibold tabular-nums" style={{ fontFamily: "'Fraunces', serif" }}>
            {left.days > 0 && <span className="text-2xl">{left.days}d </span>}
            <span className="text-2xl">
              {String(left.hours).padStart(2, "0")}:{String(left.minutes).padStart(2, "0")}:
              {String(left.seconds).padStart(2, "0")}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={link}
      className="block rounded-2xl p-5 mb-6 animate-fadeIn hover:scale-[1.01] transition-transform shadow-lg"
      style={bannerStyle("linear-gradient(120deg, var(--color-primary-solid), #e0ac52 140%)")}
    >
      <div className="flex items-center gap-4">
        <div className="text-4xl flex-shrink-0 animate-bounce">🎁</div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold mb-0.5" style={{ fontFamily: "'Fraunces', serif" }}>
            Bokwrapped {releasedYear} er her!
          </h3>
          <p className="text-sm opacity-90">Se leseåret ditt, leserpersonligheten din og årets Book Awards →</p>
        </div>
      </div>
    </Link>
  );
};

const WrappedBanner = () => {
  const [status, setStatus] = useState(null);
  const [release, setRelease] = useState(null);

  useEffect(() => {
    wrappedApi
      .getStatus(year)
      .then(setStatus)
      .catch(() => {});
    wrappedApi
      .getRelease(releasedYear)
      .then(setRelease)
      .catch(() => {});
  }, []);

  // A scheduled or recent release takes over from the collection banner
  if (release?.releaseAt) {
    const sinceRelease = (Date.now() - new Date(release.releaseAt).getTime()) / 86400000;
    if (sinceRelease < SHOW_RELEASED_DAYS) {
      const collecting = status?.windowOpen && releasedYear === year;
      if (!collecting || sinceRelease >= 0) return <ReleaseBanner release={release} />;
    }
  }

  if (!status || !status.windowOpen) return null;

  const done = status.completedCount === 3;

  return (
    <Link
      to="/bokwrapped"
      className="block rounded-2xl p-4 mb-6 animate-fadeIn hover:opacity-95 transition-opacity"
      style={{
        background: done
          ? "linear-gradient(120deg, var(--color-sage), #1f5d3e 150%)"
          : "linear-gradient(120deg, var(--color-primary-solid), var(--color-secondary-solid) 150%)",
        color: "#fff6ec",
      }}
    >
      <div className="flex items-center gap-4">
        <div className="text-3xl flex-shrink-0">🎁</div>
        <div className="min-w-0">
          <h3 className="font-semibold mb-0.5" style={{ fontFamily: "'Fraunces', serif" }}>
            {done ? `Du er klar for Bokwrapped ${year}! 🎉` : `Din Bokwrapped ${year} venter`}
          </h3>
          <p className="text-sm opacity-90">
            {done
              ? "Vi varsler deg her så snart admin har generert oppsummeringen etter nyttår."
              : "Bekreft leselisten, ranger bokklubbøkene og send inn dine Book Awards-nominasjoner."}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs opacity-90">
        <span>{status.completedCount} av 3 steg fullført</span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.3)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${(status.completedCount / 3) * 100}%`, background: "#fff" }}
          />
        </div>
        <span>Frist 27. des</span>
      </div>
    </Link>
  );
};

export default WrappedBanner;
