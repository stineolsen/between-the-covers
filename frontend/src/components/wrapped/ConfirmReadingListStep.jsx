import { useEffect, useState } from "react";
import { useToast } from "../../contexts/useToast";
import { booksApi } from "../../api/booksApi";
import { userBooksApi } from "../../api/userBooksApi";
import wrappedApi from "../../api/wrappedApi";
import BookCoverFallback from "../common/BookCoverFallback";
import DateEditor from "../common/DateEditor";

const ConfirmReadingListStep = ({ year, onNext }) => {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [showAddField, setShowAddField] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    wrappedApi
      .getOverview(year)
      .then((data) => setRows(data.books || []))
      .catch(() => toast.error("Klarte ikke hente leselisten"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  useEffect(() => {
    if (!showAddField) return;
    const timeout = setTimeout(() => {
      setSearching(true);
      booksApi
        .getBooks({ search: search || undefined, sort: "title" })
        .then((data) => setSearchResults((data.books || []).slice(0, 8)))
        .catch(() => toast.error("Klarte ikke søke etter bøker"))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, showAddField]);

  const toggleChecked = (userBookId) => {
    setRows((prev) =>
      prev.map((r) => (r.userBookId === userBookId ? { ...r, checked: !r.checked } : r)),
    );
  };

  const handleDateSave = async (userBookId, iso) => {
    try {
      await userBooksApi.updateFinishedDate(userBookId, iso);
      setRows((prev) =>
        prev.map((r) =>
          r.userBookId === userBookId ? { ...r, finishedAt: iso, flagged: false } : r,
        ),
      );
      setEditingId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke lagre datoen");
    }
  };

  const handleAddBook = async (book) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { userBook } = await userBooksApi.setBookStatus(book._id, "read");
      await userBooksApi.updateFinishedDate(userBook._id, today);
      setRows((prev) => [
        {
          userBookId: userBook._id,
          book,
          finishedAt: today,
          flagged: false,
          checked: true,
        },
        ...prev,
      ]);
      setShowAddField(false);
      setSearch("");
      setSearchResults([]);
      toast.success(`${book.title} lagt til som lest i ${year}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke legge til boken");
    }
  };

  const persist = async () => {
    const excludedBookIds = rows.filter((r) => !r.checked).map((r) => r.book?._id);
    await wrappedApi.confirmBooks(year, excludedBookIds);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await persist();
      toast.success("Kladd lagret ✓");
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke lagre kladden");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      await persist();
      onNext();
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke lagre leselisten");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ color: "var(--color-text-muted)" }}>Henter leselisten din...</p>;
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
        Stemmer dette?
      </h3>
      <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
        Vi har markert disse bøkene som lest i {year} basert på datoene dine. Fjern de som
        egentlig hører til et annet år, rett opp datoen med blyanten, eller legg til en bok du
        glemte å markere.
      </p>

      <div className="flex flex-col gap-2 mb-4">
        {rows.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>
            Ingen bøker markert som lest ennå.
          </p>
        )}
        {rows.map((row) => {
          const book = row.book;
          if (!book) return null;
          const coverUrl = book.coverImage ? booksApi.getCoverUrl(book.coverImage) : null;

          return (
            <div
              key={row.userBookId}
              className="grid gap-3 p-2.5 rounded-xl items-center"
              style={{
                gridTemplateColumns: "34px 1fr auto",
                border: `1px solid ${row.flagged ? "var(--color-terracotta)" : "var(--color-border)"}`,
                background: row.flagged ? "var(--color-terracotta-tint)" : "var(--color-card)",
                opacity: row.checked ? 1 : 0.55,
              }}
            >
              <div className="w-[34px] aspect-[2/3] rounded overflow-hidden flex-shrink-0">
                <BookCoverFallback src={coverUrl} alt={book.title} className="w-full h-full object-cover" />
              </div>

              <div className="min-w-0">
                <b className="block text-sm truncate">{book.title}</b>
                {editingId === row.userBookId ? (
                  <DateEditor
                    initialDate={row.finishedAt}
                    onSave={(iso) => handleDateSave(row.userBookId, iso)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <span
                    className="text-xs flex items-center gap-1.5"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {book.author} ·{" "}
                    {row.finishedAt
                      ? `lest ${new Date(row.finishedAt).toLocaleDateString("nb-NO")}`
                      : "dato mangler"}
                    <button
                      onClick={() => setEditingId(row.userBookId)}
                      title="Rediger dato"
                      style={{ color: "var(--color-text-faint)" }}
                    >
                      ✏️
                    </button>
                  </span>
                )}
                {row.flagged && (
                  <div className="text-xs font-bold mt-0.5" style={{ color: "var(--color-terracotta)" }}>
                    ⚠ Sjekk om denne faktisk ble lest i {year}
                  </div>
                )}
              </div>

              <button
                onClick={() => toggleChecked(row.userBookId)}
                className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  border: `2px solid ${row.checked ? "var(--color-primary)" : "var(--color-border-strong)"}`,
                  background: row.checked ? "var(--color-primary-solid)" : "none",
                  color: "#fff",
                }}
                title={row.checked ? "Teller med i wrapped" : "Teller ikke med"}
              >
                {row.checked ? "✓" : ""}
              </button>
            </div>
          );
        })}
      </div>

      {!showAddField ? (
        <button
          onClick={() => setShowAddField(true)}
          className="w-full text-left p-2.5 rounded-xl text-sm font-bold mb-5"
          style={{
            border: "1.5px dashed var(--color-border-strong)",
            color: "var(--color-primary)",
          }}
        >
          ＋ Legg til en bok du glemte å markere som lest
        </button>
      ) : (
        <div className="mb-5">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk etter tittel eller forfatter..."
            className="input-field mb-2"
          />
          {searching && (
            <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
              Søker...
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            {searchResults.map((book) => (
              <button
                key={book._id}
                onClick={() => handleAddBook(book)}
                className="flex items-center gap-2.5 p-2 rounded-lg text-left text-sm"
                style={{ background: "var(--color-sunken)" }}
              >
                <b className="truncate">{book.title}</b>
                <span style={{ color: "var(--color-text-muted)" }}>{book.author}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setShowAddField(false);
              setSearch("");
              setSearchResults([]);
            }}
            className="text-xs font-bold mt-2"
            style={{ color: "var(--color-text-faint)" }}
          >
            Avbryt
          </button>
        </div>
      )}

      <div
        className="flex justify-between items-center pt-4"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <button
          onClick={handleSaveDraft}
          disabled={saving}
          className="text-sm font-bold"
          style={{ color: "var(--color-text-faint)" }}
        >
          Lagre kladd
        </button>
        <button onClick={handleNext} disabled={saving} className="btn-primary text-sm">
          Neste: ranger bokklubbøker →
        </button>
      </div>
    </div>
  );
};

export default ConfirmReadingListStep;
