import { useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import listsApi from "../../api/listsApi";

const ListFormModal = ({ list, onClose, onSaved }) => {
  const toast = useToast();
  const isEditing = !!list;

  const [title, setTitle] = useState(list?.title || "");
  const [description, setDescription] = useState(list?.description || "");
  const [notes, setNotes] = useState(list?.notes || "");
  const [visibility, setVisibility] = useState(list?.visibility || "private");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Tittel er påkrevd");
      return;
    }
    setSaving(true);
    try {
      const data = isEditing
        ? await listsApi.updateList(list._id, { title, description, notes, visibility })
        : await listsApi.createList({ title, description, notes, visibility });
      toast.success(isEditing ? "Listen ble oppdatert" : "Liste opprettet! 📋");
      onSaved?.(data.list);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke lagre listen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div
        className="w-full max-w-lg rounded-2xl p-6 animate-fadeIn shadow-2xl"
        style={{ background: "linear-gradient(135deg, #fff 80%, rgba(124,58,237,0.06))" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold gradient-text">{isEditing ? "✏️ Rediger liste" : "📋 Ny liste"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tittel *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="F.eks. Sommerens leseliste"
              maxLength={150}
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Beskrivelse</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="En kort beskrivelse av listen..."
              maxLength={500}
              rows={2}
              className="input-field w-full resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notater</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Lengre notater om listen (valgfritt)..."
              maxLength={5000}
              rows={4}
              className="input-field w-full resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Synlighet</label>
            <div className="flex gap-3">
              <label
                className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer border-2 transition-all text-sm font-medium select-none ${
                  visibility === "private"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-purple-300"
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={visibility === "private"}
                  onChange={() => setVisibility("private")}
                />
                🔒 Privat
              </label>
              <label
                className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer border-2 transition-all text-sm font-medium select-none ${
                  visibility === "public"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-purple-300"
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={visibility === "public"}
                  onChange={() => setVisibility("public")}
                />
                🌍 Offentlig
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Offentlige lister kan sees av alle godkjente medlemmer.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-white font-bold transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}
            >
              {saving ? "Lagrer..." : isEditing ? "Lagre endringer" : "Opprett liste"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
            >
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ListFormModal;
