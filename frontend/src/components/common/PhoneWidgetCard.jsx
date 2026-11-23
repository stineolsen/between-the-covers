import { useEffect, useState } from "react";
import { widgetApi } from "../../api/widgetApi";
import { useToast } from "../../contexts/useToast";
import widgetScript from "../../widget/btc-widget.scriptable.js?raw";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STEPS = [
  "Installer den gratis appen «Scriptable» fra App Store.",
  "Trykk «Lag widget-skript» under, og så «Kopier skriptet».",
  "Åpne Scriptable, trykk + og lim inn. Gi skriptet navnet «Between the Covers».",
  "Hold inne på hjemskjermen → Rediger → Legg til widget → Scriptable. Velg størrelse.",
  "Trykk på den nye widgeten, velg skriptet «Between the Covers» og eventuelt en parameter.",
];

const PARAMS = [
  ["bok", "Boka du leser nå, med omslag og prosent"],
  ["plan", "🎯 Dagens mål fra leseplanen"],
  ["møte", "Neste bokklubbmøte"],
  ["mål", "Lesemålet ditt i år"],
  ["(tom)", "Oversikt – bok, dagens mål og neste møte"],
];

const fmtDate = (d) => new Date(d).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });

// Profile card: make a personal widget key and get a ready-to-paste
// Scriptable script with the key and server address filled in.
const PhoneWidgetCard = () => {
  const toast = useToast();
  const [status, setStatus] = useState(null); // { hasToken, createdAt }
  const [script, setScript] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    widgetApi.getTokenStatus().then(setStatus).catch(() => setStatus({ hasToken: false }));
  }, []);

  const create = async () => {
    if (status?.hasToken && !window.confirm("Du har allerede en widget-nøkkel. En ny nøkkel gjør at widgetene du har nå slutter å virke til du limer inn det nye skriptet. Fortsette?")) return;
    setBusy(true);
    try {
      const data = await widgetApi.createToken();
      setScript(
        widgetScript
          .replace("__API_URL__", API_URL.replace(/\/$/, ""))
          .replace("__SITE_URL__", window.location.origin)
          .replace("__WIDGET_TOKEN__", data.token),
      );
      setStatus({ hasToken: true, createdAt: data.createdAt });
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke lage widget-nøkkel");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      toast.success("Skriptet er kopiert – lim det inn i Scriptable");
    } catch {
      toast.error("Klarte ikke kopiere – merk teksten og kopier den selv");
    }
  };

  const remove = async () => {
    if (!window.confirm("Fjerne widget-nøkkelen? Alle widgetene dine slutter å virke.")) return;
    setBusy(true);
    try {
      await widgetApi.deleteToken();
      setStatus({ hasToken: false });
      setScript("");
      toast.success("Widget-nøkkelen er fjernet");
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke fjerne nøkkelen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-gradient mt-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold gradient-text mb-1">📱 Widgets på iPhone</h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Boka du leser, dagens lesemål og neste møte – på hjemskjermen og låseskjermen.
          </p>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} className="btn-secondary text-sm px-4 py-2" aria-expanded={open}>
          {open ? "Skjul" : "Sett opp"}
        </button>
      </div>

      {open && (
        <div className="mt-5 grid gap-5">
          <ol className="grid gap-2 text-sm list-decimal pl-5">
            {STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
            <li>
              Låseskjerm: hold inne låseskjermen → Tilpass → Låseskjerm → trykk på widget-feltet → Scriptable.
            </li>
          </ol>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-faint)" }}>
              Parameter – hva widgeten viser
            </p>
            <dl className="grid gap-1 text-sm">
              {PARAMS.map(([key, label]) => (
                <div key={key} className="flex gap-3">
                  <dt className="font-mono font-bold w-14 flex-shrink-0">{key}</dt>
                  <dd style={{ color: "var(--color-text-muted)" }}>{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {script ? (
            <div className="grid gap-2">
              <div className="flex gap-2 flex-wrap">
                <button type="button" onClick={copy} className="btn-primary text-sm px-5 py-2">
                  📋 Kopier skriptet
                </button>
              </div>
              <textarea
                readOnly
                value={script}
                onFocus={(e) => e.target.select()}
                className="input-field font-mono text-xs h-40"
                aria-label="Widget-skript for Scriptable"
              />
              <p className="text-xs" style={{ color: "var(--color-terracotta)" }}>
                Skriptet inneholder din personlige nøkkel og vises bare nå. Ikke del det med andre.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <button type="button" onClick={create} disabled={busy || !status} className="btn-primary text-sm px-5 py-2 disabled:opacity-50">
                {busy ? "Lager…" : status?.hasToken ? "Lag nytt widget-skript" : "Lag widget-skript"}
              </button>
              {status?.hasToken && (
                <>
                  <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>
                    Nøkkel laget {fmtDate(status.createdAt)}
                  </span>
                  <button type="button" onClick={remove} disabled={busy} className="text-xs font-bold" style={{ color: "var(--color-terracotta)" }}>
                    Fjern nøkkelen
                  </button>
                </>
              )}
            </div>
          )}

          <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
            Nøkkelen kan bare lese det widgetene viser – den kan ikke logge inn eller endre noe. iOS oppdaterer widgetene
            omtrent hvert kvarter.
          </p>
        </div>
      )}
    </div>
  );
};

export default PhoneWidgetCard;
