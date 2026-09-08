import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { booksApi } from "../../api/booksApi";

const OL_COVER = (coverId) =>
  coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;

const GENRE_BLOCKLIST = ["accessible book", "protected daisy", "in library", "internet archive", "nook"];
const cleanSubjects = (subjects = []) =>
  subjects
    .filter((s) => !GENRE_BLOCKLIST.some((b) => s.toLowerCase().includes(b)))
    .slice(0, 6);

// Maps a Nasjonalbiblioteket (National Library of Norway) language code to
// what the rest of the app expects in the free-text "language" field. Uses
// the same English words the backend normalizes everything to (MongoDB's
// text index only accepts a fixed set of English language names).
const NB_LANGUAGE_NAMES = { nob: "Norwegian", nno: "Norwegian", nor: "Norwegian", eng: "English", swe: "Swedish", dan: "Danish" };

// Normalizes an Open Library or Nasjonalbiblioteket search result into the
// shape the picker/confirm-step below needs, so both sources render and
// select the same way.
const normalizeOpenLibraryDoc = (doc) => ({
  key: `ol-${doc.key}`,
  title: doc.title || "",
  author: (doc.author_name || []).join(", "),
  year: doc.first_publish_year || "",
  pageCount: doc.number_of_pages_median || "",
  isbn: (doc.isbn || [])[0] || "",
  genres: cleanSubjects(doc.subject),
  language: "English",
  series: "",
  coverUrl: OL_COVER(doc.cover_i) || "",
});

const normalizeNbItem = (item) => {
  const m = item.metadata || {};
  const langCode = (m.languages || [])[0]?.code;
  return {
    key: `nb-${item.id}`,
    title: m.title || "",
    author: (m.creators || []).join(", "),
    year: parseInt(m.originInfo?.issued, 10) || "",
    pageCount: m.pageCount || "",
    isbn: (m.identifiers?.isbn13 || [])[0] || "",
    genres: [],
    language: NB_LANGUAGE_NAMES[langCode] || "Norsk",
    series: (m.series || [])[0] || "",
    coverUrl: item._links?.thumbnail_medium?.href || "",
  };
};

// A single search result row - same layout regardless of which API it came from.
const ResultRow = ({ doc, onSelect }) => (
  <button
    onClick={() => onSelect(doc)}
    className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-purple-50 transition-colors text-left"
  >
    <div className="w-10 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
      {doc.coverUrl ? (
        <img src={doc.coverUrl} alt={doc.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">📖</div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-gray-900 truncate">{doc.title}</p>
      <p className="text-sm text-gray-500 truncate">
        {doc.author}
        {doc.year ? ` · ${doc.year}` : ""}
      </p>
    </div>
  </button>
);

const AddBookModal = ({ onClose, onCreated, initialQuery = "" }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState("search"); // "search" | "confirm"
  const [query, setQuery] = useState(initialQuery);
  const [olResults, setOlResults] = useState([]);
  const [nbResults, setNbResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const debounceRef = useRef(null);

  const [form, setForm] = useState({
    title: "", author: "", description: "", publishedYear: "",
    pageCount: "", isbn: "", genres: [], language: "Engelsk",
    series: "", seriesNumber: "", coverImageUrl: "",
  });
  const [genreInput, setGenreInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchOpenLibrary = async (q) => {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&fields=key,title,author_name,first_publish_year,isbn,number_of_pages_median,cover_i,subject,publisher`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.docs || []).map(normalizeOpenLibraryDoc);
  };

  const fetchNasjonalbiblioteket = async (q) => {
    const url = `https://api.nb.no/catalog/v1/items?q=${encodeURIComponent(q)}&filter=mediatype:b%C3%B8ker&size=8`;
    const res = await fetch(url);
    const data = await res.json();
    return (data._embedded?.items || []).map(normalizeNbItem);
  };

  const performSearch = async (q) => {
    if (!q.trim()) { setOlResults([]); setNbResults([]); return; }
    setSearching(true);
    setSearchError("");
    const [ol, nb] = await Promise.allSettled([fetchOpenLibrary(q), fetchNasjonalbiblioteket(q)]);
    setOlResults(ol.status === "fulfilled" ? ol.value : []);
    setNbResults(nb.status === "fulfilled" ? nb.value : []);
    if (ol.status === "rejected" && nb.status === "rejected") {
      setSearchError("Greide ikke søke — sjekk internettforbindelsen.");
    }
    setSearching(false);
  };

  useEffect(() => {
    if (initialQuery.trim()) performSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(val), 400);
  };

  const handleSelect = (doc) => {
    setForm({
      title: doc.title,
      author: doc.author,
      description: "",
      publishedYear: doc.year,
      pageCount: doc.pageCount,
      isbn: doc.isbn,
      genres: doc.genres,
      language: doc.language,
      series: doc.series,
      seriesNumber: "",
      coverImageUrl: doc.coverUrl,
    });
    setGenreInput("");
    setSubmitError("");
    setStep("confirm");
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const addGenre = () => {
    const g = genreInput.trim();
    if (g && !form.genres.includes(g)) {
      setForm((prev) => ({ ...prev, genres: [...prev.genres, g] }));
    }
    setGenreInput("");
  };

  const removeGenre = (g) =>
    setForm((prev) => ({ ...prev, genres: prev.genres.filter((x) => x !== g) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await booksApi.createBook({
        title: form.title,
        author: form.author,
        description: form.description,
        publishedYear: form.publishedYear ? parseInt(form.publishedYear) : undefined,
        pageCount: form.pageCount ? parseInt(form.pageCount) : undefined,
        isbn: form.isbn || undefined,
        genres: form.genres,
        language: form.language,
        series: form.series || null,
        seriesNumber: form.seriesNumber ? parseInt(form.seriesNumber) : null,
        coverImageUrl: form.coverImageUrl || undefined,
        libraryLinks: { audiobook: null, ebook: null },
      });
      if (onCreated) {
        onCreated(result.book);
      } else {
        navigate(`/books/${result.book._id}`);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Greide ikke legge til bok.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            {step === "confirm" && (
              <button
                onClick={() => setStep("search")}
                className="text-gray-400 hover:text-gray-700 font-bold text-lg transition-colors"
              >
                ←
              </button>
            )}
            <h2 className="text-2xl font-bold gradient-text">
              {step === "search" ? "📚 Legg til bok" : "✏️ Bekreft og legg til"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 font-bold text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-8 py-6">

          {/* ── Step 1: Search ── */}
          {step === "search" && (
            <div className="space-y-4">
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  placeholder="Søk etter tittel eller forfatter..."
                  className="input-field pr-10"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {searchError && (
                <p className="text-red-500 text-sm font-semibold">{searchError}</p>
              )}

              {olResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">📖 Open Library</p>
                  {olResults.map((doc) => (
                    <ResultRow key={doc.key} doc={doc} onSelect={handleSelect} />
                  ))}
                </div>
              )}

              {nbResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">🇳🇴 Nasjonalbiblioteket</p>
                  {nbResults.map((doc) => (
                    <ResultRow key={doc.key} doc={doc} onSelect={handleSelect} />
                  ))}
                </div>
              )}

              {!searching && query && olResults.length === 0 && nbResults.length === 0 && !searchError && (
                <p className="text-center text-gray-500 py-8">Ingen resultater for «{query}»</p>
              )}

              {!query && (
                <p className="text-center text-gray-400 py-12">
                  Skriv inn en tittel eller forfatter for å søke i Open Library og Nasjonalbiblioteket
                </p>
              )}
            </div>
          )}

          {/* ── Step 2: Confirm / Edit ── */}
          {step === "confirm" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {submitError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 font-semibold text-sm">
                  {submitError}
                </div>
              )}

              {/* Cover preview */}
              {form.coverImageUrl && (
                <div className="flex justify-center">
                  <img
                    src={form.coverImageUrl}
                    alt="Bokomslag"
                    className="h-40 rounded-xl shadow-md object-cover"
                  />
                </div>
              )}

              {/* Title & Author */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tittel *</label>
                  <input name="title" required value={form.title} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Forfatter *</label>
                  <input name="author" required value={form.author} onChange={handleChange} className="input-field" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Beskrivelse</label>
                <textarea name="description" rows="3" value={form.description} onChange={handleChange} className="input-field" placeholder="Valgfritt — legg til en kort beskrivelse" />
              </div>

              {/* Year / Pages / ISBN */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Utgivelsesår</label>
                  <input name="publishedYear" type="number" value={form.publishedYear} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Antall sider</label>
                  <input name="pageCount" type="number" value={form.pageCount} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">ISBN</label>
                  <input name="isbn" value={form.isbn} onChange={handleChange} className="input-field" />
                </div>
              </div>

              {/* Language & Series */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Språk</label>
                  <input name="language" value={form.language} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Serie</label>
                  <input name="series" value={form.series} onChange={handleChange} className="input-field" placeholder="F.eks. Harry Potter" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1"># i serien</label>
                  <input name="seriesNumber" type="number" value={form.seriesNumber} onChange={handleChange} className="input-field" />
                </div>
              </div>

              {/* Genres */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Sjangere</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={genreInput}
                    onChange={(e) => setGenreInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGenre(); } }}
                    className="input-field flex-1"
                    placeholder="Legg til sjanger og trykk Enter"
                  />
                  <button type="button" onClick={addGenre} className="btn-accent">Legg til</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.genres.map((g) => (
                    <span key={g} className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #f093fb, #f5576c)" }}>
                      {g}
                      <button type="button" onClick={() => removeGenre(g)} className="hover:text-red-200 font-bold">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "⏳ Legger til..." : "✨ Legg til i biblioteket"}
                </button>
                <button type="button" onClick={onClose}
                  className="px-6 py-3 rounded-full font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                  Avbryt
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddBookModal;
