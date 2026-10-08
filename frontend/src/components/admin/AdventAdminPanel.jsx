import { useEffect, useRef, useState } from "react";
import adventApi from "../../api/adventApi";
import VisibilityToggle from "./VisibilityToggle";

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

const toPayload = (form) => ({
  ...form,
  altTitles: form.altTitles
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean),
  publishedYear: form.publishedYear ? Number(form.publishedYear) : null,
});

// Small inline search box for linking an existing library book as a new
// door's answer - same /api/advent/search endpoint the player-facing guess
// box uses. Optional: leave empty and the backend finds-or-creates a hidden
// candidate Book from the typed title/author instead.
const BookLinkField = ({ selectedBook, onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSelect(null);
    setOpen(true);
    clearTimeout(timer.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(() => {
      adventApi
        .search(value)
        .then((data) => setResults(data.results || []))
        .catch(() => setResults([]));
    }, 200);
  };

  if (selectedBook) {
    return (
      <div className="flex items-center gap-2 input-field py-2 text-sm sm:col-span-2">
        <span className="flex-1">
          Lenket til: <strong>{selectedBook.title}</strong> — {selectedBook.author}
        </span>
        <button type="button" onClick={() => { onSelect(null); setQuery(""); }} className="text-xs font-bold" style={{ color: "var(--color-terracotta)" }}>
          Fjern
        </button>
      </div>
    );
  }

  return (
    <div className="relative sm:col-span-2">
      <input
        className="input-field py-2 text-sm w-full"
        placeholder="Lenk til eksisterende bok i biblioteket (valgfritt - la stå tom for å opprette ny skjult bok)"
        value={query}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 rounded-lg overflow-hidden z-10 max-h-48 overflow-y-auto" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", boxShadow: "0 10px 24px rgba(0,0,0,0.14)" }}>
          {results.map((b) => (
            <button
              key={b._id}
              type="button"
              className="block w-full text-left px-3 py-2 text-sm hover:opacity-80"
              style={{ borderBottom: "1px solid var(--color-border)" }}
              onMouseDown={() => {
                onSelect(b);
                setOpen(false);
              }}
            >
              <span className="block font-semibold">{b.title}</span>
              <span className="block text-xs" style={{ color: "var(--color-text-faint)" }}>{b.author}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DoorFormFields = ({ form, setForm, extra }) => (
  <div className="grid sm:grid-cols-2 gap-2">
    {extra}
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
);

const AdventAdminPanel = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editingDay, setEditingDay] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingDay, setDeletingDay] = useState(null);

  const [creating, setCreating] = useState(false);
  const [createDay, setCreateDay] = useState("");
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createBook, setCreateBook] = useState(null);
  const [createSaving, setCreateSaving] = useState(false);

  const [publishing, setPublishing] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [uploadingDay, setUploadingDay] = useState(null);

  const [visibility, setVisibilityState] = useState(null); // "open" | "admin-only" | "hidden" | null (loading)
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
      const messages = {
        open: `Julekalenderen ${year} er nå åpen for alle medlemmer.`,
        "admin-only": `Julekalenderen ${year} er nå skjult for alle unntatt admin.`,
        hidden: `Julekalenderen ${year} er nå skjult for alle, også admin.`,
      };
      setMessage(messages[next]);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Klarte ikke endre synlighet");
    } finally {
      setVisibilityBusy(false);
    }
  };

  const openCreate = () => {
    setCreating(true);
    setCreateDay("");
    setCreateForm(EMPTY_FORM);
    setCreateBook(null);
    setEditingDay(null);
  };

  const cancelCreate = () => setCreating(false);

  const submitCreate = async () => {
    const day = Number(createDay);
    if (!day || day < 1 || day > 24) {
      setError("Luke må være et tall mellom 1 og 24");
      return;
    }
    if (!createForm.title.trim() || !createForm.author.trim() || !createForm.genre.trim()) {
      setError("Tittel, forfatter og sjanger er påkrevd");
      return;
    }
    setCreateSaving(true);
    setError("");
    try {
      await adventApi.adminCreateDay(year, day, {
        ...toPayload(createForm),
        bookId: createBook?._id,
      });
      setMessage(`Luke ${day} opprettet!`);
      setTimeout(() => setMessage(""), 3000);
      setCreating(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Klarte ikke opprette luken");
    } finally {
      setCreateSaving(false);
    }
  };

  const startEdit = (door) => {
    setEditingDay(door.day);
    setForm(toForm(door));
    setCreating(false);
  };

  const cancelEdit = () => {
    setEditingDay(null);
    setForm(EMPTY_FORM);
  };

  const saveEdit = async (day) => {
    setSaving(true);
    setError("");
    try {
      await adventApi.adminUpdateDay(year, day, toPayload(form));
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

  const handleDelete = async (door) => {
    if (!window.confirm(`Slette luke ${door.day} (${door.title})? Dette fjerner også alle forsøk/resultater knyttet til den. Boken i biblioteket berøres ikke.`)) {
      return;
    }
    setDeletingDay(door.day);
    setError("");
    try {
      await adventApi.adminDeleteDay(year, door.day);
      setMessage(`Luke ${door.day} slettet.`);
      setTimeout(() => setMessage(""), 3000);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Klarte ikke slette luken");
    } finally {
      setDeletingDay(null);
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
          Opprett luker her, eller i bulk med <code>node seedAdventCalendar.js bøker.csv --year={year}</code>. Last
          opp omslag per luke, og styr om kalenderen er synlig.
        </p>

        <div className="flex items-center gap-3 flex-wrap mb-4">
          <label className="text-sm font-bold text-text-muted">År:</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || year)}
            className="input-field py-2 w-auto"
          />
          <button onClick={openCreate} className="btn-primary px-4 py-2 text-sm">
            ➕ Ny luke
          </button>
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

        <VisibilityToggle value={visibility} busy={visibilityBusy} onChange={toggleVisibility} label={`Synlighet for ${year}:`} />

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

      {creating && (
        <div className="container-gradient">
          <h4 className="text-xl font-bold gradient-text mb-3">Ny luke for {year}</h4>
          <div className="grid sm:grid-cols-2 gap-2 mb-2">
            <input
              type="number"
              min="1"
              max="24"
              className="input-field py-2 text-sm sm:col-span-2"
              placeholder="Luke-nummer (1-24)"
              value={createDay}
              onChange={(e) => setCreateDay(e.target.value)}
            />
          </div>
          <DoorFormFields
            form={createForm}
            setForm={setCreateForm}
            extra={<BookLinkField selectedBook={createBook} onSelect={setCreateBook} />}
          />
          <div className="flex gap-2 mt-3">
            <button onClick={submitCreate} disabled={createSaving} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
              {createSaving ? "Oppretter..." : "Opprett luke"}
            </button>
            <button onClick={cancelCreate} className="px-4 py-2 rounded-xl text-sm font-bold bg-sunken text-text-muted">
              Avbryt
            </button>
          </div>
        </div>
      )}

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
                  <DoorFormFields form={form} setForm={setForm} />
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
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(door)} className="btn-secondary px-4 py-2 text-sm">
                        ✏️ Rediger
                      </button>
                      <button
                        onClick={() => handleDelete(door)}
                        disabled={deletingDay === door.day}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                        style={{ background: "var(--color-terracotta-solid)" }}
                      >
                        {deletingDay === door.day ? "..." : "🗑️ Slett"}
                      </button>
                    </div>
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
