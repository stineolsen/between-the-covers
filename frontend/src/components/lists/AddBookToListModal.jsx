import { useState, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext";
import { booksApi } from "../../api/booksApi";
import listsApi from "../../api/listsApi";
import BookCoverFallback from "../common/BookCoverFallback";
import AddBookModal from "../books/AddBookModal";

const AddBookToListModal = ({ listId, existingBookIds, onClose, onAdded }) => {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const existingIds = new Set(existingBookIds);

  const handleAdd = async (bookId) => {
    setAddingId(bookId);
    try {
      const data = await listsApi.addBook(listId, bookId);
      toast.success("Boken ble lagt til!");
      onAdded?.(data.list);
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke legge til boken");
    } finally {
      setAddingId(null);
    }
  };

  const handleBookCreated = async (book) => {
    setShowCreateModal(false);
    setBooks((prev) => [book, ...prev]);
    await handleAdd(book._id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div
        className="w-full max-w-lg rounded-2xl p-6 animate-fadeIn shadow-2xl max-h-[85vh] flex flex-col"
        style={{ background: "linear-gradient(135deg, #fff 80%, rgba(124,58,237,0.06))" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold gradient-text">➕ Legg til bok</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">
            ✕
          </button>
        </div>

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
            <div className="text-center py-6">
              <p className="text-gray-500 mb-3">Ingen bøker funnet</p>
              {search.trim() && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}
                >
                  🌐 Ikke i biblioteket? Legg til fra Open Library
                </button>
              )}
            </div>
          ) : (
            books.map((book) => {
              const alreadyOnList = existingIds.has(book._id);
              return (
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
                  </div>
                  <button
                    onClick={() => handleAdd(book._id)}
                    disabled={alreadyOnList || addingId === book._id}
                    className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}
                  >
                    {alreadyOnList ? "✓ Lagt til" : addingId === book._id ? "..." : "+ Legg til"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showCreateModal && (
        <AddBookModal onClose={() => setShowCreateModal(false)} onCreated={handleBookCreated} />
      )}
    </div>
  );
};

export default AddBookToListModal;
