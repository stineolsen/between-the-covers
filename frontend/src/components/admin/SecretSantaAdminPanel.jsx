import { useEffect, useState } from "react";
import secretSantaApi from "../../api/secretSantaApi";
import UserAvatar from "../common/UserAvatar";

const nameOf = (u) => u?.displayName || u?.username || "?";
const formatDate = (d) =>
  new Date(d).toLocaleString("nb-NO", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

// Draw first, check who's in it, then open it for the members. The pairs are
// never shown here - the admin is one of the participants.
const SecretSantaAdminPanel = () => {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    secretSantaApi
      .getAdmin()
      .then(setState)
      .catch((err) => setError(err.response?.data?.message || "Klarte ikke hente Secret Santa"));
  }, []);

  const run = async (action, successText) => {
    setBusy(true);
    setError("");
    try {
      setState(await action());
      setMessage(successText);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Noe gikk galt");
    } finally {
      setBusy(false);
    }
  };

  if (!state) {
    return (
      <div className="container-gradient text-center py-12">
        <p className="font-bold" style={{ color: error ? "var(--color-terracotta)" : "var(--color-text-muted)" }}>
          {error || "Laster Secret Santa…"}
        </p>
      </div>
    );
  }

  const { year, members, draw } = state;
  const drawnIds = new Set((draw?.participants || []).map((p) => p._id));
  // Members who joined (or left) since the draw - a redraw picks them up
  const outOfDate =
    draw && (members.length !== drawnIds.size || members.some((m) => !drawnIds.has(m._id)));

  return (
    <div className="container-gradient space-y-5">
      <div>
        <h3 className="text-2xl font-bold gradient-text">🎅 Secret Santa {year}</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Alle godkjente medlemmer er med, unntatt testbrukeren. Ingen trekker seg selv, alle gir til én og får fra
          én. Du ser ikke hvem som har hvem her, siden du selv er med.
        </p>
      </div>

      {/* Status */}
      <div className="rounded-xl p-4" style={{ background: "var(--color-sunken)" }}>
        {!draw ? (
          <p className="font-bold">Ikke trukket ennå.</p>
        ) : draw.open ? (
          <p className="font-bold" style={{ color: "var(--color-sage)" }}>
            🟢 Åpen – medlemmene ser hvem de skal gi til på forsiden (siden {formatDate(draw.openedAt)}).
          </p>
        ) : (
          <p className="font-bold">
            ✅ Trukket {formatDate(draw.drawnAt)} – <span style={{ color: "var(--color-primary)" }}>ikke åpnet ennå</span>.
            Medlemmene ser ingenting før du åpner.
          </p>
        )}
        {outOfDate && (
          <p className="text-sm font-bold mt-2" style={{ color: "var(--color-terracotta)" }}>
            ⚠️ Medlemslisten har endret seg siden trekningen. {draw.open ? "Lukk og trekk" : "Trekk"} på nytt for å få
            med alle.
          </p>
        )}
      </div>

      {/* Participants */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-faint)" }}>
          {draw ? `Med i trekningen · ${draw.participants.length}` : `Blir med i trekningen · ${members.length}`}
        </p>
        <div className="flex flex-wrap gap-2">
          {(draw ? draw.participants : members).map((u) => (
            <span
              key={u._id}
              className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-sm font-medium"
              style={{ background: "var(--color-sunken)" }}
            >
              <UserAvatar user={u} className="w-7 h-7 rounded-full text-xs" />
              {nameOf(u)}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {!draw && (
          <button
            onClick={() => run(secretSantaApi.draw, "Trekningen er gjort! 🎁")}
            disabled={busy || members.length < 2}
            className="btn-primary px-5 py-2.5 disabled:opacity-50"
          >
            🎲 Trekk
          </button>
        )}
        {draw && !draw.open && (
          <>
            <button
              onClick={() => run(() => secretSantaApi.setOpen(true), "Åpnet for medlemmene! 🎅")}
              disabled={busy}
              className="btn-primary px-5 py-2.5 disabled:opacity-50"
            >
              🎅 Åpne for medlemmene
            </button>
            <button
              onClick={() => {
                if (window.confirm("Trekke på nytt? Den forrige trekningen forsvinner.")) {
                  run(secretSantaApi.draw, "Trukket på nytt!");
                }
              }}
              disabled={busy}
              className="btn-secondary px-5 py-2.5 disabled:opacity-50"
            >
              🎲 Trekk på nytt
            </button>
          </>
        )}
        {draw?.open && (
          <button
            onClick={() => {
              if (window.confirm("Lukke Secret Santa? Knappen forsvinner fra forsiden, men trekningen beholdes.")) {
                run(() => secretSantaApi.setOpen(false), "Lukket for medlemmene");
              }
            }}
            disabled={busy}
            className="btn-secondary px-5 py-2.5 disabled:opacity-50"
          >
            🔒 Lukk
          </button>
        )}
        {draw && (
          <button
            onClick={() => {
              if (window.confirm("Slette trekningen helt? Alle mister hvem de har trukket.")) {
                run(secretSantaApi.reset, "Trekningen er slettet");
              }
            }}
            disabled={busy}
            className="px-5 py-2.5 rounded-full text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "var(--color-terracotta-solid)" }}
          >
            🗑️ Slett trekningen
          </button>
        )}
      </div>

      {error && (
        <p className="p-3 rounded-xl text-white font-bold text-sm text-center" style={{ background: "var(--color-terracotta-solid)" }}>
          {error}
        </p>
      )}
      {message && (
        <p className="p-3 rounded-xl text-white font-bold text-sm text-center" style={{ background: "var(--color-sage-solid)" }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default SecretSantaAdminPanel;
