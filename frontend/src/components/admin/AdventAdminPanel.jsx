import { useEffect, useState } from "react";
import adventApi from "../../api/adventApi";

const EMPTY_FORM = {
  title: "",
  author: "",
  altTitles: "",
  isbn: "",
  publishedYear: "",
  pageCount: "",
  genre: "",
  hint1: "",
  hint2: "",
  hint3: "",
};

const toForm = (door) => ({
  title: door.title || "",
  author: door.author || "",
  altTitles: (door.altTitles || []).join(", "),
  isbn: door.isbn || "",
  publishedYear: door.publishedYear || "",
  pageCount: door.pageCount || "",
  genre: door.genre || "",
  hint1: door.hint1 || "",
  hint2: door.hint2 || "",
  hint3: door.hint3 || "",
});

const AdventAdminPanel = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editingDay, setEditingDay] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [publishing, setPublishing] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [uploadingDay, setUploadingDay] = useState(null);

  const [visibility, setVisibilityState] = useState(null); // "open" | "admin-only" | null (loading)
  const [visibilityBusy, setVisibilityBusy] = useState(false);

  // No separate "loading" trigger here - `loading` starts true for the
  // first render, and later calls (year change, after a save) just replace
  // `days` in place once the fetch resolves.
  const load = () => {
    adventApi
      .adminListDays(year)
      .then((data) => setDays(data.days || []))
      .catch(() => setError("Klarte ikke hente luker"))
      .finally(() => setLoading(false));
  };

  const loadVisibility = () => {
    adventApi
      .adminGetVisibility(year)
      .then((data) => setVisibilityState(data.visibility))
      .catch(() => {});
  };

  useEffect(() => {
    load();
    loadVisibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const toggleVisibility = async (next) => {
    if (next === visibility) return;
    setVisibilityBusy(true);
    setError("");
    try {
      const data = await adventApi.adminSetVisibility(year, next);
      setVisibilityState(data.visibility);
      setMessage(
        next === "open"
          ? `Julekalenderen ${year} er nå åpen for alle medlemmer.`
          : `Julekalenderen ${year} er nå skjult for alle unntatt admin.`,
      );
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Klarte ikke endre synlighet");
    } finally {
      setVisibilityBusy(false);
    }
  };

  const startEdit = (door) => {
    setEditingDay(door.day);
    setForm(toForm(door));
  };

  const cancelEdit = () => {
    setEditingDay(null);
    setForm(EMPTY_FORM);
  };

  const saveEdit = async (day) => {
    setSaving(true);
    setError("");
    try {
      await adventApi.adminUpdateDay(year, day, {
        ...form,
        altTitles: form.altTitles
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        publishedYear: form.publishedYear ? Number(form.publishedYear) : null,
      });
      setMessage(`Luke ${day} oppdatert!`);
      setTimeout(() => setMessage(""), 3000);
      cancelEdit();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Klarte ikke lagre luken");
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async (day, file) => {
    if (!file) return;
    setUploadingDay(day);
    setError("");
    try {
      await adventApi.adminUploadDayImage(year, day, file);
      setMessage(`Bilde lastet opp for luke ${day}!`);
      setTimeout(() => setMessage(""), 3000);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Klarte ikke laste opp bildet");
    } finally {
      setUploadingDay(null);
    }
  };

  const runPublishDue = async () => {
    setPublishing(true);
    setError("");
    try {
      await adventApi.adminPublishDue(year);
      setMessage("Forfalte luker er publisert til biblioteket!");
      setTimeout(() => setMessage(""), 3000);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Klarte ikke publisere luker");
    } finally {
      setPublishing(false);
    }
  };

  const runRecalculateBadges = async () => {
    setRecalculating(true);
    setError("");
    try {
      const data = await adventApi.adminRecalculateBadges(year);
      const awarded = (data.results || []).filter((r) => r.earnedThresholds?.length > 0).length;
      setMessage(`Badges regnet ut på nytt — ${awarded} medlemmer har minst én dør-badge.`);
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Klarte ikke regne ut badges");
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="grid gap-6 animate-fadeIn">
      <div className="container-gradient">
        <h3 className="text-2xl font-bold gradient-text mb-2">🎄 Julekalender</h3>
        <p className="text-text-muted mb-4">
          Luker legges inn med <code>node seedAdventCalendar.js bøker.csv --year={year}</code>. Her kan du rette
          tekstfeil, laste opp omslag per luke, og styre om kalenderen er synlig.
        </p>

        <div className="flex items-center gap-3 flex-wrap mb-4">
          <label className="text-sm font-bold text-text-muted">År:</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || year)}
            className="input-field py-2 w-auto"
          />
          <button onClick={runPublishDue} disabled={publishing} className="btn-secondary px-4 py-2 text-sm disabled:opacity-50">
            {publishing ? "Publiserer..." : "📚 Publiser forfalte luker"}
          </button>
          <button
            onClick={runRecalculateBadges}
            disabled={recalculating}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
          >
            {recalculating ? "Regner ut..." : "🏅 Regn ut badges på nytt"}
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap p-3 rounded-xl" style={{ background: "var(--color-sunken)" }}>
          <span className="text-sm font-bold text-text-muted">Synlighet for {year}:</span>
          <div className="flex rounded-full overflow-hidden" style={{ border: "1px solid var(--color-border-strong)" }}>
            <button
              onClick={() => toggleVisibility("open")}
              disabled={visibilityBusy || visibility === null}
              className="px-4 py-1.5 text-sm font-bold disabled:opacity-50"
              style={
                visibility === "open"
                  ? { background: "var(--color-sage-solid)", color: "#fff" }
                  : { background: "var(--color-card)", color: "var(--color-text-muted)" }
              }
            >
              🌍 Åpen for alle
            </button>
            <button
              onClick={() => toggleVisibility("admin-only")}
              disabled={visibilityBusy || visibility === null}
              className="px-4 py-1.5 text-sm font-bold disabled:opacity-50"
              style={
                visibility === "admin-only"
                  ? { background: "var(--color-terracotta-solid)", color: "#fff" }
                  : { background: "var(--color-card)", color: "var(--color-text-muted)" }
              }
            >
              🔒 Kun admin
            </button>
          </div>
          {visibility === "admin-only" && (
            <span className="text-xs" style={{ color: "var(--color-terracotta)" }}>
              Skjult for medlemmer — banneret på forsiden og /julekalender gir 404 for alle andre enn admin.
            </span>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl text-white font-bold text-sm text-center" style={{ background: "var(--color-terracotta-solid)" }}>
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 p-3 rounded-xl text-white font-bold text-sm text-center" style={{ background: "var(--color-sage-solid)" }}>
            {message}
          </div>
        )}
      </div>

      {loading ? (
        <div className="container-gradient text-center py-12">
          <p className="text-text-muted font-bold">Laster luker...</p>
        </div>
      ) : days.length === 0 ? (
        <div className="container-gradient text-center py-12">
          <p className="text-text-muted text-lg font-bold">Ingen luker lagt inn for {year} ennå.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {days.map((door) => (
            <div key={door.day} className="container-gradient">
              {editingDay === door.day ? (
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold gradient-text">Luke {door.day}</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input className="input-field py-2 text-sm" placeholder="Tittel" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                    <input className="input-field py-2 text-sm" placeholder="Forfatter" value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} />
                    <input className="input-field py-2 text-sm" placeholder="Alternative titler (kommaseparert)" value={form.altTitles} onChange={(e) => setForm((f) => ({ ...f, altTitles: e.target.value }))} />
                    <input className="input-field py-2 text-sm" placeholder="ISBN" value={form.isbn} onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))} />
                    <input className="input-field py-2 text-sm" placeholder="Utgitt år" value={form.publishedYear} onChange={(e) => setForm((f) => ({ ...f, publishedYear: e.target.value }))} />
                    <input className="input-field py-2 text-sm" placeholder="Sider (f.eks. ca. 400)" value={form.pageCount} onChange={(e) => setForm((f) => ({ ...f, pageCount: e.target.value }))} />
                    <input className="input-field py-2 text-sm sm:col-span-2" placeholder="Sjanger" value={form.genre} onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))} />
                    <input className="input-field py-2 text-sm sm:col-span-2" placeholder="Hint 1" value={form.hint1} onChange={(e) => setForm((f) => ({ ...f, hint1: e.target.value }))} />
                    <input className="input-field py-2 text-sm sm:col-span-2" placeholder="Hint 2" value={form.hint2} onChange={(e) => setForm((f) => ({ ...f, hint2: e.target.value }))} />
                    <input className="input-field py-2 text-sm sm:col-span-2" placeholder="Hint 3" value={form.hint3} onChange={(e) => setForm((f) => ({ ...f, hint3: e.target.value }))} />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => saveEdit(door.day)} disabled={saving} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
                      {saving ? "Lagrer..." : "Lagre"}
                    </button>
                    <button onClick={cancelEdit} className="px-4 py-2 rounded-xl text-sm font-bold bg-sunken text-text-muted">
                      Avbryt
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <h4 className="text-lg font-bold gradient-text truncate">
                      Luke {door.day}: {door.title}
                    </h4>
                    <p className="text-text-muted text-sm">{door.author} · {door.genre || "ingen sjanger"}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                        style={
                          door.publishedToLibraryAt
                            ? { background: "var(--color-sage-tint)", color: "var(--color-sage)" }
                            : { background: "var(--color-sunken)", color: "var(--color-text-faint)" }
                        }
                      >
                        {door.publishedToLibraryAt ? "✅ I biblioteket" : "🔒 Skjult til frist"}
                      </span>
                      {!door.imageOriginalKey && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: "var(--color-terracotta-tint)", color: "var(--color-terracotta)" }}>
                          ⚠ Mangler bilder
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button onClick={() => startEdit(door)} className="btn-secondary px-4 py-2 text-sm">
                      ✏️ Rediger
                    </button>
                    <label className="text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer" style={{ background: "var(--color-sunken)", color: "var(--color-text-muted)" }}>
                      {uploadingDay === door.day ? "Laster opp..." : door.imageOriginalKey ? "🖼️ Bytt bilde" : "🖼️ Last opp bilde"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingDay === door.day}
                        onChange={(e) => {
                          handleImageChange(door.day, e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdventAdminPanel;
