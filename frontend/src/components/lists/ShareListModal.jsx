import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/useAuth";
import { useToast } from "../../contexts/useToast";
import { usersApi } from "../../api/usersApi";
import listsApi from "../../api/listsApi";
import UserAvatar from "../common/UserAvatar";

const ShareListModal = ({ list, onClose, onShared }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const excludedIds = new Set([
    user?._id,
    list.owner?._id,
    ...(list.collaborators || []).map((c) => c._id || c),
  ]);

  useEffect(() => {
    usersApi
      .getMembers()
      .then((data) => {
        const others = (data.members || []).filter((m) => !excludedIds.has(m._id));
        setMembers(others);
      })
      .catch(() => toast.error("Klarte ikke laste medlemsliste"))
      .finally(() => setLoading(false));
  }, []);

  const toggleAll = () => {
    if (selected.size === members.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(members.map((m) => m._id)));
    }
  };

  const toggleMember = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0) {
      toast.error("Velg minst én person å dele med");
      return;
    }
    setSending(true);
    try {
      const data = await listsApi.addCollaborators(list._id, Array.from(selected), message);
      toast.success("Listen ble delt! 📋");
      onShared?.(data.list);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke dele listen");
    } finally {
      setSending(false);
    }
  };

  const allSelected = members.length > 0 && selected.size === members.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div
        className="w-full max-w-md rounded-2xl p-6 animate-fadeIn shadow-2xl"
        style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg gradient-text">Del «{list.title}» med...</h3>
          <button onClick={onClose} className="text-xl font-bold leading-none hover:opacity-70 transition-opacity" style={{ color: "var(--color-text-faint)" }}>
            ✕
          </button>
        </div>

        <p className="text-xs mb-4" style={{ color: "var(--color-text-faint)" }}>
          Personer du deler med kan redigere listen, legge til/fjerne bøker og invitere andre.
        </p>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-7 h-7 border-4 border-[var(--color-wine-tint)] border-t-[var(--color-primary)] rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <p className="text-center py-4" style={{ color: "var(--color-text-faint)" }}>Ingen flere medlemmer å dele med.</p>
        ) : (
          <>
            <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 accent-[var(--color-primary)]"
              />
              <span className="font-semibold text-sm" style={{ color: "var(--color-text-muted)" }}>Alle</span>
            </label>

            <div className="space-y-2 max-h-52 overflow-y-auto mb-4 pr-1">
              {members.map((member) => {
                const name = member.displayName || member.username;
                return (
                  <label
                    key={member._id}
                    className="flex items-center gap-3 cursor-pointer select-none rounded-xl px-3 py-2 hover:bg-[var(--color-sunken)] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(member._id)}
                      onChange={() => toggleMember(member._id)}
                      className="w-4 h-4 accent-[var(--color-primary)] flex-shrink-0"
                    />
                    <UserAvatar
                      user={member}
                      className="w-8 h-8 rounded-full font-bold text-sm flex-shrink-0"
                    />
                    <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{name}</span>
                  </label>
                );
              })}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Legg til en melding (valgfritt)..."
              className="w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:border-[var(--color-primary)] mb-4"
              style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text)" }}
            />

            <div className="flex gap-3">
              <button
                onClick={handleSend}
                disabled={sending || selected.size === 0}
                className="flex-1 py-2 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--color-primary-solid)" }}
              >
                {sending ? "Deler..." : `Del med ${selected.size > 0 ? selected.size : ""} ${selected.size === 1 ? "person" : "personer"}`}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border text-sm font-medium transition-colors hover:bg-[var(--color-sunken)]"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
              >
                Avbryt
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShareListModal;
