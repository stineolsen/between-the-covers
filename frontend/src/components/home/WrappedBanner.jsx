import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import wrappedApi from "../../api/wrappedApi";

const year = new Date().getFullYear();

const WrappedBanner = () => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    wrappedApi
      .getStatus(year)
      .then(setStatus)
      .catch(() => {});
  }, []);

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
