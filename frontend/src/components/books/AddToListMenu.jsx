import { useState, useEffect, useRef } from "react";
import { useToast } from "../../contexts/ToastContext";
import listsApi from "../../api/listsApi";
import ListFormModal from "../lists/ListFormModal";

const AddToListMenu = ({ book }) => {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState(null); // null = not fetched yet
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && lists === null) {
      setLoading(true);
      listsApi
        .getMyLists()
        .then((data) => setLists(data.lists || []))
        .catch(() => toast.error("Klarte ikke hente listene dine"))
        .finally(() => setLoading(false));
    }
  };

  const isOnList = (list) =>
    list.books.some((entry) => (entry.book?._id || entry.book) === book._id);

  const handleAdd = async (listId) => {
    setAddingId(listId);
    try {
      await listsApi.addBook(listId, book._id);
      setLists((prev) =>
        prev.map((l) => (l._id === listId ? { ...l, books: [...l.books, { book }] } : l)),
      );
      toast.success("Lagt til i listen!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke legge til i listen");
    } finally {
      setAddingId(null);
    }
  };

  const handleListCreated = async (list) => {
    setShowFormModal(false);
    try {
      await listsApi.addBook(list._id, book._id);
      setLists((prev) => [{ ...list, books: [{ book }] }, ...(prev || [])]);
      toast.success(`Opprettet «${list.title}» og la til boken!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke legge til i listen");
    }
  };

  return (
    <div className="relative w-full" ref={menuRef}>
      <button
        onClick={handleToggle}
        className="w-full py-2 rounded-xl text-white font-semibold text-sm transition-all"
        style={{ background: "linear-gradient(135deg, #059669, #0d9488)" }}
      >
        📋 Legg til i liste
      </button>

      {open && (
        <div
          className="absolute z-40 mt-2 w-64 rounded-2xl shadow-2xl p-3 animate-fadeIn"
          style={{ background: "linear-gradient(135deg, #fff 80%, rgba(16,185,129,0.06))" }}
        >
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-4 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : lists && lists.length > 0 ? (
            <div className="space-y-1 max-h-56 overflow-y-auto mb-2">
              {lists.map((list) => {
                const already = isOnList(list);
                return (
                  <button
                    key={list._id}
                    onClick={() => !already && handleAdd(list._id)}
                    disabled={already || addingId === list._id}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-sm font-medium hover:bg-emerald-50 transition-colors disabled:hover:bg-transparent"
                  >
                    <span className="truncate text-gray-800">{list.title}</span>
                    <span className="flex-shrink-0 text-xs">
                      {addingId === list._id ? "..." : already ? "✓" : "+"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-3">Du har ingen lister ennå</p>
          )}

          <button
            onClick={() => {
              setOpen(false);
              setShowFormModal(true);
            }}
            className="w-full text-xs font-bold px-3 py-2 rounded-xl text-emerald-700 hover:bg-emerald-50 transition-colors border-t border-gray-100 mt-1 pt-2"
          >
            ✨ Ny liste
          </button>
        </div>
      )}

      {showFormModal && (
        <ListFormModal onClose={() => setShowFormModal(false)} onSaved={handleListCreated} />
      )}
    </div>
  );
};

export default AddToListMenu;
