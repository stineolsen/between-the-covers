import { useState, useEffect } from "react";
import { useToast } from "../../contexts/useToast";
import { booksApi } from "../../api/booksApi";
import { importApi } from "../../api/importApi";
import BookCoverFallback from "../common/BookCoverFallback";

// Lets an admin manually link one of runAbsSync's unmatched Audiobookshelf
// items to an existing library book - the admin-driven equivalent of what
// the automatic ISBN/title matching does.
const MatchAbsItemModal = ({ item, onClose, onMatched }) => {
  const toast = useToast();
  const [search, setSearch] = useState(item.title || "");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchingId, setMatchingId] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      booksApi
        .getBooks({ search: search || undefined, sort: "title" })
        .then((data) => setBooks(data.books || []))
        .catch(() => toast.error("Klarte ikke søke etter bøker"))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleMatch = async (book) => {
    setMatchingId(book._id);
    try {
      const data = await importApi.matchAbsItem({
        bookId: book._id,
        absId: item.absId,
        audiobookUrl: item.audiobookUrl,
      });
      toast.success(`Koblet «${item.title}» til «${book.title}»!`);
      onMatched?.(data.book);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke koble til boken");
    } finally {
      setMatchingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div
        className="w-full max-w-lg rounded-2xl p-6 animate-fadeIn shadow-2xl max-h-[85vh] flex flex-col"
        style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold gradient-text">🔗 Match til bok</h2>
          <button onClick={onClose} className="text-xl font-bold leading-none hover:opacity-70 transition-opacity" style={{ color: "var(--color-text-faint)" }}>
            ✕
          </button>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--color-text-faint)" }}>
          Fra Audiobookshelf: <span className="font-semibold">{item.title}</span>
          {item.author && ` — ${item.author}`}
        </p>

        <input
          type="text"
          placeholder="Søk etter tittel, forfatter eller serie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field w-full mb-4"
          autoFocus
        />

        <div className="overflow-y-auto flex-1 space-y-2">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-7 h-7 border-4 border-[var(--color-wine-tint)] border-t-[var(--color-primary)] rounded-full animate-spin" />
            </div>
          ) : books.length === 0 ? (
            <p className="text-center py-6" style={{ color: "var(--color-text-faint)" }}>Ingen bøker funnet</p>
          ) : (
            books.map((book) => (
              <div
                key={book._id}
                className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-[var(--color-sunken)] transition-colors"
              >
                <BookCoverFallback
                  src={book.coverImage ? booksApi.getCoverUrl(book.coverImage) : null}
                  alt={book.title}
                  className="w-10 h-14 object-cover rounded-md flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{book.title}</p>
                  <p className="text-xs truncate" style={{ color: "var(--color-text-faint)" }}>{book.author}</p>
                  {book.libraryLinks?.audiobook && (
                    <p className="text-xs" style={{ color: "var(--color-terracotta)" }}>Har allerede en lydboklenke</p>
                  )}
                </div>
                <button
                  onClick={() => handleMatch(book)}
                  disabled={matchingId === book._id}
                  className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all disabled:opacity-50"
                  style={{ background: "var(--color-primary-solid)" }}
                >
                  {matchingId === book._id ? "..." : "Match"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchAbsItemModal;
