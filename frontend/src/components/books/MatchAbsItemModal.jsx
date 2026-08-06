import { useState, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext";
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
        style={{ background: "linear-gradient(135deg, #fff 80%, rgba(124,58,237,0.06))" }}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold gradient-text">🔗 Match til bok</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">
            ✕
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
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
              <div className="w-7 h-7 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : books.length === 0 ? (
            <p className="text-gray-500 text-center py-6">Ingen bøker funnet</p>
          ) : (
            books.map((book) => (
              <div
                key={book._id}
                className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/50 transition-colors"
              >
                <BookCoverFallback
                  src={book.coverImage ? booksApi.getCoverUrl(book.coverImage) : null}
                  alt={book.title}
                  className="w-10 h-14 object-cover rounded-md flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{book.title}</p>
                  <p className="text-xs text-gray-500 truncate">{book.author}</p>
                  {book.libraryLinks?.audiobook && (
                    <p className="text-xs text-amber-600">Har allerede en lydboklenke</p>
                  )}
                </div>
                <button
                  onClick={() => handleMatch(book)}
                  disabled={matchingId === book._id}
                  className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}
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
