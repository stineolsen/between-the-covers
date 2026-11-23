import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import secretSantaApi from "../../api/secretSantaApi";
import UserAvatar from "../common/UserAvatar";

const bannerStyle = { background: "linear-gradient(120deg, #b5182f, #6e1020 140%)", color: "#fff6ec" };

// Shown on the homepage once admin has opened this year's draw. The match is
// hidden behind a tap, so it isn't on screen for anyone looking over your
// shoulder until you choose to see it.
const SecretSantaBanner = () => {
  const [mine, setMine] = useState(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    secretSantaApi
      .getMine()
      .then((data) => setMine(data.open ? data : null))
      .catch(() => {});
  }, []);

  if (!mine) return null;
  const name = mine.receiver.displayName || mine.receiver.username;

  return (
    <div className="rounded-2xl p-4 mb-6 animate-fadeIn shadow-lg" style={bannerStyle}>
      <div className="flex items-center gap-4">
        <div className="text-4xl flex-shrink-0" aria-hidden="true">
          🎅
        </div>
        <div className="min-w-0 flex-1" aria-live="polite">
          <h3 className="font-semibold mb-0.5" style={{ fontFamily: "'Fraunces', serif" }}>
            Secret Santa {mine.year}
          </h3>
          {revealed ? (
            <p className="text-sm">
              Du er Secret Santa for{" "}
              <Link to={`/members/${mine.receiver._id}`} className="font-bold underline underline-offset-2">
                {name}
              </Link>{" "}
              ! Hysj, ikke si det til noen!
            </p>
          ) : (
            <p className="text-sm opacity-90">Trekningen er klar. Trykk for å se hvem du skal gi en gave til.</p>
          )}
        </div>
        {revealed ? (
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <UserAvatar user={mine.receiver} className="w-12 h-12 rounded-full ring-2 ring-white/70" />
            <button type="button" onClick={() => setRevealed(false)} className="text-xs font-bold opacity-80 hover:opacity-100">
              Skjul
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="px-4 py-2 rounded-full font-bold text-sm flex-shrink-0 transition-transform hover:scale-105"
            style={{ background: "#fff6ec", color: "#8f1425" }}
          >
            Vis
          </button>
        )}
      </div>
    </div>
  );
};

export default SecretSantaBanner;
