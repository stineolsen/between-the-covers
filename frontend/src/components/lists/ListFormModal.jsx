import { useState } from "react";
import { useToast } from "../../contexts/useToast";
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
        style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold gradient-text">{isEditing ? "✏️ Rediger liste" : "📋 Ny liste"}</h2>
          <button
            onClick={onClose}
            className="text-xl font-bold leading-none hover:opacity-70 transition-opacity"
            style={{ color: "var(--color-text-faint)" }}
          >
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
                className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer border-2 transition-all text-sm font-medium select-none"
                style={
                  visibility === "private"
                    ? { borderColor: "var(--color-primary)", background: "var(--color-wine-tint)", color: "var(--color-primary)" }
                    : { borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-muted)" }
                }
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
                className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer border-2 transition-all text-sm font-medium select-none"
                style={
                  visibility === "public"
                    ? { borderColor: "var(--color-primary)", background: "var(--color-wine-tint)", color: "var(--color-primary)" }
                    : { borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-muted)" }
                }
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
            <p className="text-xs mt-1.5" style={{ color: "var(--color-text-faint)" }}>
              Offentlige lister kan sees av alle godkjente medlemmer.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Lagrer..." : isEditing ? "Lagre endringer" : "Opprett liste"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border font-medium transition-colors hover:bg-[var(--color-sunken)]"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
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
