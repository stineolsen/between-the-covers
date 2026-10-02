import { useEffect, useState } from "react";
import { booksApi } from "../../api/booksApi";
import wrappedApi from "../../api/wrappedApi";

// Two modes: "library" searches the whole catalog as-you-type (same pattern
// as ConfirmReadingListStep's "legg til bok"), "bookclub" fetches this
// year's small bookclub book set once and renders a plain <select>.
const BookPicker = ({ mode, year, value, onChange }) => {
  const [bookclubBooks, setBookclubBooks] = useState([]);
  const [loadingBookclub, setLoadingBookclub] = useState(mode === "bookclub");

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (mode !== "bookclub") return;
    wrappedApi
      .getBookclubBooks(year)
      .then((data) => setBookclubBooks(data.books || []))
      .finally(() => setLoadingBookclub(false));
  }, [mode, year]);

  useEffect(() => {
    if (mode !== "library" || !search) return;
    const timeout = setTimeout(() => {
      setSearching(true);
      booksApi
        .getBooks({ search, sort: "title" })
        .then((data) => setResults((data.books || []).slice(0, 8)))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [mode, search]);

  if (mode === "bookclub") {
    if (loadingBookclub) {
      return <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>Laster bøker...</p>;
    }
    return (
      <select
        value={value?._id || ""}
        onChange={(e) => {
          const book = bookclubBooks.find((b) => b._id === e.target.value);
          onChange(book || null);
        }}
        className="input-field py-2"
      >
        <option value="">Velg en bok...</option>
        {bookclubBooks.map((book) => (
          <option key={book._id} value={book._id}>
            {book.title} — {book.author}
          </option>
        ))}
      </select>
    );
  }

  if (value) {
    return (
      <div
        className="flex items-center justify-between gap-2 p-2 rounded-lg text-sm"
        style={{ background: "var(--color-sunken)" }}
      >
        <span className="truncate">
          <b>{value.title}</b> <span style={{ color: "var(--color-text-muted)" }}>{value.author}</span>
        </span>
        <button
          onClick={() => onChange(null)}
          className="font-bold flex-shrink-0"
          style={{ color: "var(--color-text-faint)" }}
          title="Fjern valg"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => {
          const val = e.target.value;
          setSearch(val);
          if (!val) setResults([]);
        }}
        placeholder="Søk etter tittel eller forfatter..."
        className="input-field"
      />
      {searching && (
        <p className="text-xs mt-1" style={{ color: "var(--color-text-faint)" }}>
          Søker...
        </p>
      )}
      {results.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-2">
          {results.map((book) => (
            <button
              key={book._id}
              type="button"
              onClick={() => {
                onChange(book);
                setSearch("");
                setResults([]);
              }}
              className="flex items-center gap-2.5 p-2 rounded-lg text-left text-sm"
              style={{ background: "var(--color-sunken)" }}
            >
              <b className="truncate">{book.title}</b>
              <span style={{ color: "var(--color-text-muted)" }}>{book.author}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookPicker;
