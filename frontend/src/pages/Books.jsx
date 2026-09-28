import { useState, useEffect } from "react";
import { booksApi } from "../api/booksApi";
import { userBooksApi } from "../api/userBooksApi";
import BookGrid from "../components/books/BookGrid";
import RequestBookModal from "../components/books/RequestBookModal";
import AddBookModal from "../components/books/AddBookModal";

const Books = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter states - restored from sessionStorage so filters persist when navigating back
  const savedFilters = JSON.parse(
    sessionStorage.getItem("bookFilters") || "{}",
  );
  const [search, setSearch] = useState(savedFilters.search || "");
  const [bookclubOnly, setBookclubOnly] = useState(
    savedFilters.bookclubOnly || false,
  );
  const [audiobookOnly, setAudiobookOnly] = useState(
    savedFilters.audiobookOnly || false,
  );
  const [ebookOnly, setEbookOnly] = useState(
    savedFilters.ebookOnly || false,
  );
  const [genre, setGenre] = useState(savedFilters.genre || "");
  const [sort, setSort] = useState(savedFilters.sort || "added-desc");
  const [readFilter, setReadFilter] = useState(() => {
    const saved = savedFilters.readFilter;
    if (Array.isArray(saved)) return saved;
    if (saved && saved !== "all") return [saved];
    return [];
  });
  const toggleReadFilter = (value) => {
    setReadFilter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };
  const [ownedOnly, setOwnedOnly] = useState(savedFilters.ownedOnly || false);
  const [showHidden, setShowHidden] = useState(savedFilters.showHidden || false);
  const [showFilters, setShowFilters] = useState(false);

  // Save filters to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem(
      "bookFilters",
      JSON.stringify({ search, bookclubOnly, audiobookOnly, ebookOnly, genre, sort, readFilter, ownedOnly, showHidden }),
    );
  }, [search, bookclubOnly, audiobookOnly, ebookOnly, genre, sort, readFilter, ownedOnly, showHidden]);

  const [userBookMap, setUserBookMap] = useState({});
  const [availableGenres, setAvailableGenres] = useState([]);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const GENRES_VISIBLE = 10;

  useEffect(() => {
    booksApi.getGenres()
      .then(data => setAvailableGenres(data.genres || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    userBooksApi.getUserBooks()
      .then(data => {
        const map = {};
        (data.userBooks || []).forEach(ub => {
          const id = ub.book?._id || ub.book;
          if (id) map[id] = { status: ub.status, _id: ub._id, owned: ub.owned, hidden: ub.hidden };
        });
        setUserBookMap(map);
      })
      .catch(() => {});
  }, []);

  const handleStatusChange = (bookId, status, userBookId, hidden) => {
    setUserBookMap(prev => {
      const next = { ...prev };
      const existing = prev[bookId] || {};
      if (status || hidden !== undefined) {
        next[bookId] = {
          ...existing,
          ...(status !== undefined ? { status, _id: userBookId } : {}),
          ...(hidden !== undefined ? { hidden } : {}),
        };
      } else if (!status && hidden === undefined) {
        delete next[bookId];
      }
      return next;
    });
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (search) params.search = search;
      if (bookclubOnly) params.bookclubOnly = "true";
      if (audiobookOnly) params.audiobookOnly = "true";
      if (ebookOnly) params.ebookOnly = "true";
      if (genre) params.genre = genre;
      if (sort) params.sort = sort;
      if (readFilter.length > 0) params.readFilter = readFilter.join(",");
      if (ownedOnly) params.ownedOnly = "true";
      if (showHidden) params.showHidden = "true";

      const data = await booksApi.getBooks(params);
      setBooks(data.books);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load books");
      console.error("Error fetching books:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [search, bookclubOnly, audiobookOnly, ebookOnly, genre, sort, readFilter, ownedOnly, showHidden]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const clearFilters = () => {
    setSearch("");
    setBookclubOnly(false);
    setAudiobookOnly(false);
    setOwnedOnly(false);
    setShowHidden(false);
    setGenre("");
    setSort("added-desc");
    setReadFilter("all");
    sessionStorage.removeItem("bookFilters");
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fadeIn">
          <div>
            <h1 className="text-5xl font-bold gradient-text mb-3">
              Bibilotek
            </h1>
            <p className="text-lg" style={{ color: "var(--color-text-muted)" }}>
              {books.length} {books.length === 1 ? "bok" : "bøker"} i vårt
              bibilotek
            </p>
          </div>

          <div className="flex gap-2 sm:gap-3 flex-wrap justify-end">
            <button
              onClick={() => setShowRequestModal(true)}
              className="btn-accent text-sm px-3 py-2 sm:text-base sm:px-7 sm:py-3"
            >
              Be om en bok
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-secondary text-sm px-3 py-2 sm:text-base sm:px-7 sm:py-3"
            >
              ✨ Legg til bok
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div
          className="flex flex-wrap gap-3 items-center p-3 rounded-2xl mb-3"
          style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
        >
          <div
            className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-lg"
            style={{ background: "var(--color-sunken)" }}
          >
            <span style={{ color: "var(--color-text-faint)" }}>🔍</span>
            <input
              type="text"
              placeholder="Søk etter tittel, forfatter eller serie..."
              value={search}
              onChange={handleSearchChange}
              className="w-full bg-transparent outline-none text-sm"
              style={{ color: "var(--color-text)" }}
            />
          </div>

          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: "1.5px solid var(--color-border-strong)" }}
          >
            <button
              onClick={() => setReadFilter([])}
              className="px-3 py-2 text-sm font-semibold transition-all"
              style={
                readFilter.length === 0
                  ? { background: "var(--color-primary-solid)", color: "white" }
                  : { background: "var(--color-card)", color: "var(--color-text-muted)" }
              }
            >
              Alle
            </button>
            {[
              { value: "read", label: "Lest" },
              { value: "unread", label: "Ulest" },
              { value: "dnf", label: "DNF" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => toggleReadFilter(value)}
                className="px-3 py-2 text-sm font-semibold transition-all"
                style={{
                  borderLeft: "1.5px solid var(--color-border-strong)",
                  ...(readFilter.includes(value)
                    ? { background: "var(--color-primary-solid)", color: "white" }
                    : { background: "var(--color-card)", color: "var(--color-text-muted)" }),
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input-field"
            style={{ width: "auto", padding: "0.5rem 0.7rem" }}
          >
            <optgroup label="Tittel">
              <option value="title-asc">Tittel A-Å</option>
              <option value="title-desc">Tittel Å-A</option>
            </optgroup>
            <optgroup label="Forfatter etternavn">
              <option value="lastname-asc">Etternavn A-Å</option>
              <option value="lastname-desc">Etternavn Å-A</option>
            </optgroup>
            <optgroup label="Forfatter fornavn">
              <option value="firstname-asc">Fornavn A-Å</option>
              <option value="firstname-desc">Fornavn Å-A</option>
            </optgroup>
            <optgroup label="Lagt til">
              <option value="added-desc">Sist lagt til</option>
              <option value="added-asc">Tidligst lagt til</option>
            </optgroup>
            <optgroup label="Rating">
              <option value="rating-desc">Høyest rated</option>
              <option value="rating-asc">Lavest rated</option>
            </optgroup>
            <optgroup label="Antall lest">
              <option value="readcount-desc">Flest lest</option>
              <option value="readcount-asc">Færrest lest</option>
            </optgroup>
          </select>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className="px-3 py-2 rounded-full text-sm font-semibold transition-all"
            style={
              showFilters
                ? { background: "var(--color-wine-tint)", color: "var(--color-primary)", border: "1.5px solid var(--color-primary)" }
                : { background: "var(--color-card)", color: "var(--color-text-muted)", border: "1.5px solid var(--color-border-strong)" }
            }
          >
            Filter {showFilters ? "▲" : "▼"}
          </button>
        </div>

        {/* Collapsible filter row */}
        {showFilters && (
          <div
            className="flex flex-wrap items-center gap-2 p-3 rounded-2xl mb-8"
            style={{ background: "var(--color-sunken)" }}
          >
            {[
              { checked: bookclubOnly, set: setBookclubOnly, label: "Klubbens bøker" },
              { checked: audiobookOnly, set: setAudiobookOnly, label: "Lydbok" },
              { checked: ebookOnly, set: setEbookOnly, label: "E-bok" },
              { checked: ownedOnly, set: setOwnedOnly, label: "Eier boken" },
              { checked: showHidden, set: setShowHidden, label: "Vis skjulte bøker" },
            ].map(({ checked, set, label }) => (
              <button
                key={label}
                onClick={() => set((v) => !v)}
                className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={
                  checked
                    ? { background: "var(--color-primary-solid)", color: "white", border: "1.5px solid var(--color-primary-solid)" }
                    : { background: "var(--color-card)", color: "var(--color-text-muted)", border: "1.5px solid var(--color-border-strong)" }
                }
              >
                {label}
              </button>
            ))}

            <span
              className="w-px self-stretch mx-1"
              style={{ background: "var(--color-border-strong)" }}
            />

            <button
              onClick={() => setGenre("")}
              className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={
                genre === ""
                  ? { background: "var(--color-primary-solid)", color: "white", border: "1.5px solid var(--color-primary-solid)" }
                  : { background: "var(--color-card)", color: "var(--color-text-muted)", border: "1.5px solid var(--color-border-strong)" }
              }
            >
              Alle sjangere
            </button>
            {(showAllGenres ? availableGenres : availableGenres.slice(0, GENRES_VISIBLE)).map((g) => (
              <button
                key={g.name}
                onClick={() => setGenre(g.name)}
                className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={
                  genre === g.name
                    ? { background: "var(--color-primary-solid)", color: "white", border: "1.5px solid var(--color-primary-solid)" }
                    : { background: "var(--color-card)", color: "var(--color-text-muted)", border: "1.5px solid var(--color-border-strong)" }
                }
              >
                {g.name}
                <span className="ml-1 opacity-60 text-xs">({g.count})</span>
              </button>
            ))}
            {availableGenres.length > GENRES_VISIBLE && (
              <button
                onClick={() => setShowAllGenres((v) => !v)}
                className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={{ background: "transparent", color: "var(--color-text-faint)", border: "1.5px dashed var(--color-border-strong)" }}
              >
                {showAllGenres
                  ? "Vis færre"
                  : `+${availableGenres.length - GENRES_VISIBLE} flere`}
              </button>
            )}

            <button
              onClick={clearFilters}
              className="ml-auto text-sm font-semibold px-3 py-1.5"
              style={{ color: "var(--color-terracotta)" }}
            >
              ✖ Fjern all filtrering
            </button>
          </div>
        )}

        {/* Books Grid */}
        <BookGrid books={books} loading={loading} error={error} userBookMap={userBookMap} onStatusChange={handleStatusChange} />
      </div>

      {showRequestModal && (
        <RequestBookModal onClose={() => setShowRequestModal(false)} />
      )}
      {showAddModal && (
        <AddBookModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
};

export default Books;
