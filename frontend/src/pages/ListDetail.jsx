import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import listsApi from "../api/listsApi";
import BookRankingList from "../components/lists/BookRankingList";
import AddBookToListModal from "../components/lists/AddBookToListModal";
import ShareListModal from "../components/lists/ShareListModal";
import ListFormModal from "../components/lists/ListFormModal";
import CommentThread from "../components/lists/CommentThread";
import UserAvatar from "../components/common/UserAvatar";

const ListDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchList();
  }, [id]);

  const fetchList = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await listsApi.getList(id);
      setList(data.list);
    } catch (err) {
      setError(err.response?.data?.message || "Klarte ikke laste listen");
    } finally {
      setLoading(false);
    }
  };

  const isOwner = user && list?.owner && list.owner._id === user._id;
  const isCollaborator = user && list?.collaborators?.some((c) => c._id === user._id);
  const canEdit = isOwner || isCollaborator;

  const handleBooksChange = (newBooks) => {
    setList((prev) => ({ ...prev, books: newBooks }));
  };

  const handleRemoveCollaborator = async (userId) => {
    try {
      const data = await listsApi.removeCollaborator(list._id, userId);
      setList(data.list);
      toast.success("Samarbeidspartner fjernet");
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke fjerne samarbeidspartner");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Er du sikker på at du vil slette denne listen? Dette kan ikke angres.")) return;
    setDeleting(true);
    try {
      await listsApi.deleteList(list._id);
      toast.success("Listen ble slettet");
      navigate("/lists");
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke slette listen");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="card bg-red-50 border border-red-200 text-red-700 text-center py-12">
          <p className="text-lg font-semibold mb-2">Greide ikke laste listen</p>
          <p>{error || "Listen ble ikke funnet"}</p>
        </div>
      </div>
    );
  }

  const ownerName = list.owner?.displayName || list.owner?.username || "Ukjent";

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="container-gradient mb-8 animate-fadeIn">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-bold gradient-text">{list.title}</h1>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={
                    list.visibility === "public"
                      ? { background: "rgba(16,185,129,0.12)", color: "#059669" }
                      : { background: "rgba(107,91,149,0.12)", color: "#6b5b95" }
                  }
                >
                  {list.visibility === "public" ? "🌍 Offentlig" : "🔒 Privat"}
                </span>
              </div>
              {list.description && <p className="text-gray-700">{list.description}</p>}
            </div>
          </div>

          {list.notes && (
            <div className="mt-4 p-4 rounded-xl bg-white/60">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Notater</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{list.notes}</p>
            </div>
          )}

          {/* Owner + collaborators */}
          <div className="flex items-center gap-2 flex-wrap mt-4">
            <div className="flex items-center gap-1.5" title={`Eier: ${ownerName}`}>
              <UserAvatar user={list.owner} className="w-7 h-7 rounded-full text-xs font-bold" />
              <span className="text-xs text-gray-600 font-medium">{ownerName} (eier)</span>
            </div>
            {(list.collaborators || []).map((c) => {
              const name = c.displayName || c.username;
              return (
                <div key={c._id} className="flex items-center gap-1.5 bg-white/60 rounded-full pl-1 pr-2 py-0.5">
                  <UserAvatar user={c} className="w-7 h-7 rounded-full text-xs font-bold" />
                  <span className="text-xs text-gray-600 font-medium">{name}</span>
                  {canEdit && (
                    <button
                      onClick={() => handleRemoveCollaborator(c._id)}
                      className="text-gray-400 hover:text-red-500 text-xs font-bold leading-none ml-1"
                      title="Fjern samarbeidspartner"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap mt-5">
            {canEdit && (
              <>
                <button onClick={() => setShowEditModal(true)} className="text-sm px-4 py-2 rounded-full font-bold transition-all transform hover:scale-105" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "white" }}>
                  ✏️ Rediger
                </button>
                <button onClick={() => setShowShareModal(true)} className="text-sm px-4 py-2 rounded-full font-bold transition-all transform hover:scale-105" style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)", color: "white" }}>
                  🤝 Del
                </button>
              </>
            )}
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm px-4 py-2 rounded-full font-bold transition-all transform hover:scale-105 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white" }}
              >
                {deleting ? "Sletter..." : "🗑️ Slett liste"}
              </button>
            )}
          </div>
        </div>

        {/* Books */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">📚 Bøker på listen</h2>
          {canEdit && (
            <button onClick={() => setShowAddBookModal(true)} className="btn-accent text-sm py-2 px-4">
              ➕ Legg til bok
            </button>
          )}
        </div>
        <div className="mb-10">
          <BookRankingList listId={list._id} books={list.books} canEdit={canEdit} onBooksChange={handleBooksChange} />
        </div>

        {/* List-level comments */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">💬 Kommentarer</h2>
        <div className="container-gradient">
          <CommentThread listId={list._id} />
        </div>
      </div>

      {showAddBookModal && (
        <AddBookToListModal
          listId={list._id}
          existingBookIds={list.books.map((entry) => entry.book._id)}
          onClose={() => setShowAddBookModal(false)}
          onAdded={(updatedList) => setList(updatedList)}
        />
      )}
      {showShareModal && (
        <ShareListModal list={list} onClose={() => setShowShareModal(false)} onShared={(updatedList) => setList(updatedList)} />
      )}
      {showEditModal && (
        <ListFormModal list={list} onClose={() => setShowEditModal(false)} onSaved={(updatedList) => setList(updatedList)} />
      )}
    </div>
  );
};

export default ListDetail;
