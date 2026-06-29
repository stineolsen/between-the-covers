import { useState, useEffect, useRef } from "react";
import { booksApi } from "../api/booksApi";
import { userBooksApi } from "../api/userBooksApi";
import BookGrid from "../components/books/BookGrid";
import RequestBookModal from "../components/books/RequestBookModal";
import AddBookModal from "../components/books/AddBookModal";

const Books = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRestored = useRef(false);
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
  const [genre, setGenre] = useState(savedFilters.genre || "");
  const [sort, setSort] = useState(savedFilters.sort || "newest");
  const [readFilter, setReadFilter] = useState(savedFilters.readFilter || "all");
  const [ownedOnly, setOwnedOnly] = useState(savedFilters.ownedOnly || false);
  const [showHidden, setShowHidden] = useState(savedFilters.showHidden || false);

  // Save filters to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem(
      "bookFilters",
      JSON.stringify({ search, bookclubOnly, audiobookOnly, genre, sort, readFilter, ownedOnly, showHidden }),
    );
  }, [search, bookclubOnly, audiobookOnly, genre, sort, readFilter, ownedOnly, showHidden]);

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

  useEffect(() => {
    fetchBooks();
  }, [search, bookclubOnly, audiobookOnly, genre, sort, readFilter, ownedOnly, showHidden]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (search) params.search = search;
      if (bookclubOnly) params.bookclubOnly = "true";
      if (audiobookOnly) params.audiobookOnly = "true";
      if (genre) params.genre = genre;
      if (sort) params.sort = sort;
      if (readFilter !== "all") params.readFilter = readFilter;
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

  // Save scroll position when leaving the page
  useEffect(() => {
    return () => {
      sessionStorage.setItem("bookScrollY", window.scrollY);
    };
  }, []);

  // Restore scroll position after books have loaded (only once per visit)
  useEffect(() => {
    if (!loading && books.length > 0 && !scrollRestored.current) {
      const saved = sessionStorage.getItem("bookScrollY");
      if (saved) {
        scrollRestored.current = true;
        sessionStorage.removeItem("bookScrollY");
        requestAnimationFrame(() => window.scrollTo({ top: parseInt(saved), behavior: "instant" }));
      }
    }
  }, [loading, books]);

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
    setSort("newest");
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
              📚 Bibilotek
            </h1>
            <p className="text-gray-700 text-lg">
              {books.length} {books.length === 1 ? "bok" : "bøker"} i vårt
              bibilotek
            </p>
          </div>

          <div className="flex gap-3 flex-wrap justify-end">
            <button
              onClick={() => setShowRequestModal(true)}
              className="px-5 py-2.5 rounded-full font-bold text-sm transition-all transform hover:scale-105 shadow-md text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
            >
              📬 Be om en bok
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-accent"
            >
              ✨ Legg til bok
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="container-gradient mb-8">
          <div className="grid md:grid-cols-5 gap-1">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🔍 Søk etter bøker
              </label>
              <input
                type="text"
                placeholder="Søk etter tittel, forfatter eller serie..."
                value={search}
                onChange={handleSearchChange}
                className="input-field"
              />
            </div>

            {/* Bokklubb Filter */}
            <div className="flex items-center gap-2 p-4 rounded-xl bg-white hover:shadow-md transition-all">
              <input
                type="checkbox"
                id="bookclubOnly"
                checked={bookclubOnly}
                onChange={(e) => setBookclubOnly(e.target.checked)}
                className="w-5 h-5 rounded cursor-pointer"
              />
              <label
                htmlFor="bookclubOnly"
                className="text-sm font-bold text-gray-700 cursor-pointer select-none"
              >
                📅 Klubbens bøker
              </label>
            </div>

            {/* Audiobook Filter */}
            <div className="flex items-center gap-2 p-4 rounded-xl bg-white hover:shadow-md transition-all">
              <input
                type="checkbox"
                id="audiobookOnly"
                checked={audiobookOnly}
                onChange={(e) => setAudiobookOnly(e.target.checked)}
                className="w-5 h-5 rounded cursor-pointer"
              />
              <label
                htmlFor="audiobookOnly"
                className="text-sm font-bold text-gray-700 cursor-pointer select-none"
              >
                🎧 Lydbøker
              </label>
            </div>

            {/* Owned Filter */}
            <div className="flex items-center gap-2 p-4 rounded-xl bg-white hover:shadow-md transition-all">
              <input
                type="checkbox"
                id="ownedOnly"
                checked={ownedOnly}
                onChange={(e) => setOwnedOnly(e.target.checked)}
                className="w-5 h-5 rounded cursor-pointer"
              />
              <label
                htmlFor="ownedOnly"
                className="text-sm font-bold text-gray-700 cursor-pointer select-none"
              >
                📚 Eier boken
              </label>
            </div>

            {/* Show Hidden Filter */}
            <div className="flex items-center gap-2 p-4 rounded-xl bg-white hover:shadow-md transition-all">
              <input
                type="checkbox"
                id="showHidden"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
                className="w-5 h-5 rounded cursor-pointer"
              />
              <label
                htmlFor="showHidden"
                className="text-sm font-bold text-gray-700 cursor-pointer select-none"
              >
                🙈 Vis skjulte bøker
              </label>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🔄 Sorter etter
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="input-field"
              >
                <option value="newest">Nyeste først</option>
                <option value="title">Tittel A-Z</option>
                <option value="author">Forfatter fornavn A-Z</option>
                <option value="author-lastname">Forfatter etternavn A-Z</option>
                <option value="rating">Høyest rated</option>
              </select>
            </div>

            {/* Read/Unread Filter */}
            <div className="md:col-span-5">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                👁️ Lesestatus
              </label>
              <div className="flex gap-2">
                {[
                  { value: "all", label: "Alle bøker" },
                  { value: "read", label: "✅ Lest" },
                  { value: "unread", label: "📚 Ulest" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setReadFilter(value)}
                    className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
                    style={
                      readFilter === value
                        ? { background: "var(--color-primary)", color: "white", border: "1.5px solid var(--color-primary)" }
                        : { background: "white", color: "#6B5B95", border: "1.5px solid #6B5B95" }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Genre Filter */}
            <div className="md:col-span-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🎭 Sjanger
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setGenre("")}
                  className="px-2.5 py-1 rounded-full text-sm font-semibold transition-all"
                  style={
                    genre === ""
                      ? { background: "var(--color-primary)", color: "white", border: "1.5px solid var(--color-primary)" }
                      : { background: "white", color: "#6B5B95", border: "1.5px solid #6B5B95" }
                  }
                >
                  Alle sjangere
                </button>
                {(showAllGenres ? availableGenres : availableGenres.slice(0, GENRES_VISIBLE)).map((g) => (
                  <button
                    key={g.name}
                    onClick={() => setGenre(g.name)}
                    className="px-2.5 py-1 rounded-full text-sm font-semibold transition-all"
                    style={
                      genre === g.name
                        ? { background: "var(--color-primary)", color: "white", border: "1.5px solid var(--color-primary)" }
                        : { background: "white", color: "#6B5B95", border: "1.5px solid #6B5B95" }
                    }
                  >
                    {g.name}
                    <span className="ml-1 opacity-60 text-xs">({g.count})</span>
                  </button>
                ))}
                {availableGenres.length > GENRES_VISIBLE && (
                  <button
                    onClick={() => setShowAllGenres(v => !v)}
                    className="px-2.5 py-1 rounded-full text-sm font-semibold transition-all"
                    style={{ background: "white", color: "#9ca3af", border: "1.5px dashed #9ca3af" }}
                  >
                    {showAllGenres
                      ? "Vis færre"
                      : `+${availableGenres.length - GENRES_VISIBLE} flere`}
                  </button>
                )}
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="text-sm font-bold px-4 py-2 rounded-full bg-white hover:shadow-md transition-all transform hover:scale-105"
                style={{ color: "#f5576c" }}
              >
                ✖️ Fjern alt filtrering
              </button>
            </div>
          </div>
        </div>

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
