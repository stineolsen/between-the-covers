import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import badgesApi from "../../api/badgesApi";
import { useToast } from "../../contexts/useToast";
import Bookmark from "../badges/Bookmark";

// Lesemerker admin: preview what every member would hold, then launch. The
// launch awards everything earned so far with one summary notification
// per member; after that, badges come as members do things and from the
// nightly check.
const BadgesAdminPanel = () => {
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmLaunch, setConfirmLaunch] = useState(false);

  const load = () => {
    badgesApi.getAdminStatus().then(setStatus).catch(() => toast.error("Klarte ikke hente status"));
    badgesApi
      .getAdminPreview()
      .then((data) => setPreview(data.members || []))
      .catch(() => setPreview([]));
  };

  useEffect(() => {
    load();
    // toast is recreated on every toast, so it must not retrigger the fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const launch = async (enabled) => {
    setBusy(true);
    try {
      const data = await badgesApi.setLaunched(enabled);
      toast.success(enabled ? `Lesemerker er lansert! ${data.awarded} merker delt ut.` : "Lesemerker er satt på pause");
      setConfirmLaunch(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke endre lanseringen");
    } finally {
      setBusy(false);
    }
  };

  const recalc = async () => {
    setBusy(true);
    try {
      const data = await badgesApi.recalculate();
      toast.success(data.awarded ? `${data.awarded} nye merker delt ut` : "Alle er oppdatert, ingen nye merker");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke beregne merkene");
    } finally {
      setBusy(false);
    }
  };

  const total = preview?.reduce((sum, m) => sum + m.earned, 0) || 0;

  return (
    <div className="grid gap-6 animate-fadeIn">
      <div className="container-gradient">
        <h3 className="text-2xl font-bold gradient-text mb-2">🔖 Lesemerker</h3>
        <p className="text-text-muted mb-4">
          Merker for bøker, sider, lydboktimer, anmeldelser, serier, julekalender og mer. Nivåer og navn ligger i{" "}
          <code>backend/src/constants/badgeConfig.js</code>.
        </p>

        {status && (
          <p className="text-sm font-semibold mb-4">
            {status.launched
              ? `✅ Lansert ${status.at ? new Date(status.at).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" }) : ""}. Merker deles ut fortløpende og hver natt.`
              : "⏸ Ikke lansert. Medlemmene ser «kommer snart», og ingen merker deles ut (unntatt julekalenderens lukemerker)."}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {status && !status.launched && !confirmLaunch && (
            <button onClick={() => setConfirmLaunch(true)} disabled={busy} className="btn-primary px-5 py-2 text-sm">
              Lanser lesemerker
            </button>
          )}
          {confirmLaunch && (
            <div className="w-full p-4 rounded-xl grid gap-3" style={{ background: "var(--color-sunken)" }} role="alert">
              <p className="text-sm">
                Alle medlemmer får merkene de har fortjent så langt, til sammen <b>{total}</b> merker, og ett varsel hver i
                varselklokka. Fortsette?
              </p>
              <div className="flex gap-3">
                <button onClick={() => launch(true)} disabled={busy} className="btn-primary px-5 py-2 text-sm">
                  {busy ? "Lanserer…" : "Ja, lanser nå"}
                </button>
                <button onClick={() => setConfirmLaunch(false)} disabled={busy} className="text-sm font-bold text-text-muted">
                  Avbryt
                </button>
              </div>
            </div>
          )}
          {status?.launched && (
            <>
              <button onClick={recalc} disabled={busy} className="btn-secondary px-5 py-2 text-sm">
                {busy ? "Beregner…" : "Beregn på nytt nå"}
              </button>
              <button onClick={() => launch(false)} disabled={busy} className="text-sm font-bold text-text-muted">
                Sett på pause
              </button>
            </>
          )}
          <Link to="/merker" className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
            Se mine merker →
          </Link>
        </div>
      </div>

      <div className="container-gradient">
        <h3 className="text-xl font-bold gradient-text mb-1">
          {status?.launched ? "Hvem har hva" : "Forhåndsvisning: hvem ville fått hva"}
        </h3>
        <p className="text-sm text-text-muted mb-4">Regnet ut fra det som ligger i appen nå. Ingenting deles ut herfra.</p>
        {!preview ? (
          <p className="text-sm text-text-faint">Regner ut…</p>
        ) : (
          <div className="grid gap-3">
            {preview.map((member) => (
              <div key={member._id} className="p-3 rounded-xl" style={{ background: "var(--color-sunken)" }}>
                <div className="flex justify-between items-baseline gap-3 mb-2">
                  <b>{member.name}</b>
                  <span className="text-sm text-text-muted tabular-nums">{member.earned} merker</span>
                </div>
                {member.badges.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {member.badges.map((b, i) => (
                      <Bookmark key={i} color={b.color} icon={b.icon} label={b.label} width={26} title={b.name} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-faint">Ingen merker ennå</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BadgesAdminPanel;
