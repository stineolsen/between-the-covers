import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import wrappedApi from "../../api/wrappedApi";
import { useToast } from "../../contexts/useToast";
import { adminWrappedYear, formatReleaseDate } from "../../utils/wrappedYear";

// <input type="datetime-local"> works in local time without a zone
const toLocalInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Release day for the Bokwrapped results: when members can open the story,
// when the countdown on the front page ends, and when the "it's here"
// notification goes out. Has its own year picker since the results for a
// year are released the following January.
const WrappedReleasePanel = () => {
  const toast = useToast();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(adminWrappedYear());
  const [release, setRelease] = useState(null);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [previewUser, setPreviewUser] = useState("");

  useEffect(() => {
    setRelease(null);
    wrappedApi
      .getAdminRelease(year)
      .then((data) => {
        setRelease(data);
        setValue(toLocalInput(data.at) || `${year + 1}-01-03T18:00`);
      })
      .catch(() => toast.error("Klarte ikke hente slippdatoen"));
    wrappedApi
      .getAdminMembers(year)
      .then((data) => setMembers(data.members || []))
      .catch(() => setMembers([]));
    // toast is recreated on every toast, so it must not retrigger the fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const save = async (at) => {
    setSaving(true);
    try {
      const data = await wrappedApi.setAdminRelease(year, at);
      setRelease(data);
      if (at) setValue(toLocalInput(data.at));
      toast.success(at ? "Slippdatoen er lagret!" : "Slippdatoen er fjernet");
    } catch (error) {
      toast.error(error.response?.data?.message || "Klarte ikke lagre slippdatoen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-gradient">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
        <h3 className="text-2xl font-bold gradient-text">🚀 Slippdag for resultatene</h3>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-field py-2 w-auto">
          {[thisYear, thisYear - 1].map((y) => (
            <option key={y} value={y}>
              Bokwrapped {y}
            </option>
          ))}
        </select>
      </div>
      <p className="text-text-muted mb-4">
        Når medlemmene kan åpne oppsummeringen. Forsiden viser nedtelling fram til da, og alle får et varsel (push, og
        e-post til de som har skrudd på funksjonsvarsler) i det den slippes.
      </p>

      {release && (
        <p className="text-sm mb-4 font-semibold">
          {!release.at
            ? "⏸ Ingen slippdato satt - resultatene er låst for medlemmer."
            : release.released
              ? `✅ Sluppet ${formatReleaseDate(release.at)}${release.announced ? " · varsel sendt" : " · varsel sendes innen et minutt"}`
              : `⏳ Slippes ${formatReleaseDate(release.at)}`}
        </p>
      )}

      <div className="flex items-end gap-3 flex-wrap mb-6">
        <div>
          <label htmlFor="wrapped-release-at" className="block text-sm font-bold text-text-muted mb-2">
            Slipptidspunkt
          </label>
          <input
            id="wrapped-release-at"
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="input-field py-2 w-auto"
          />
        </div>
        <button
          onClick={() => save(new Date(value).toISOString())}
          disabled={saving || !value}
          className="btn-secondary px-4 py-2 text-sm"
        >
          {saving ? "Lagrer..." : "Lagre slippdato"}
        </button>
        {release?.at && (
          <button onClick={() => save(null)} disabled={saving} className="px-4 py-2 text-sm font-bold text-text-muted">
            Fjern
          </button>
        )}
      </div>

      <div className="p-4 rounded-xl grid gap-3" style={{ background: "var(--color-sunken)" }}>
        <p className="text-sm font-bold">👀 Forhåndsvis (kun admin)</p>
        <p className="text-sm text-text-muted -mt-2">
          Se oppsummeringen før den slippes - din egen eller et medlems, for å sjekke at alt ser riktig ut.
        </p>
        <div className="flex gap-3 flex-wrap items-center">
          <Link to={`/bokwrapped/${year}/resultat`} className="btn-primary px-4 py-2 text-sm">
            Min Bokwrapped {year}
          </Link>
          {members.length > 0 && (
            <>
              <select value={previewUser} onChange={(e) => setPreviewUser(e.target.value)} className="input-field py-2 w-auto">
                <option value="">Velg medlem …</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.displayName || m.username} ({m.count} bøker)
                  </option>
                ))}
              </select>
              {previewUser && (
                <Link to={`/bokwrapped/${year}/resultat?user=${previewUser}`} className="btn-secondary px-4 py-2 text-sm">
                  Forhåndsvis
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WrappedReleasePanel;
