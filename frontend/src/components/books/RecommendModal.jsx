import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../contexts/useToast';
import { usersApi } from '../../api/usersApi';
import recommendationApi from '../../api/recommendationApi';
import UserAvatar from '../common/UserAvatar';

const RecommendModal = ({ book, onClose }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    usersApi.getMembers()
      .then(data => {
        // Exclude self
        const others = (data.members || []).filter(m => m._id !== user?._id);
        setMembers(others);
      })
      .catch(() => toast.error('Klarte ikke laste medlemsliste'))
      .finally(() => setLoading(false));
  }, []);

  const toggleAll = () => {
    if (selected.size === members.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(members.map(m => m._id)));
    }
  };

  const toggleMember = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0) {
      toast.error('Velg minst én mottaker');
      return;
    }
    setSending(true);
    try {
      await recommendationApi.create(book._id, Array.from(selected), message);
      toast.success('Anbefaling sendt! 📚');
      onClose();
    } catch {
      toast.error('Klarte ikke sende anbefaling');
    } finally {
      setSending(false);
    }
  };

  const allSelected = members.length > 0 && selected.size === members.length;

  return (
    <div
      className="rounded-2xl p-6 mt-4 animate-fadeIn"
      style={{ background: 'var(--gradient-secondary)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg gradient-text">Anbefal denne boken til...</h3>
        <button
          onClick={onClose}
          className="text-xl font-bold leading-none hover:opacity-70 transition-opacity"
          style={{ color: "var(--color-text-faint)" }}
          title="Lukk"
        >✕</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-7 h-7 border-4 border-[var(--color-wine-tint)] border-t-[var(--color-primary)] rounded-full animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <p className="text-center py-4" style={{ color: "var(--color-text-faint)" }}>Ingen andre medlemmer å anbefale til.</p>
      ) : (
        <>
          {/* Select all */}
          <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="w-4 h-4 accent-[var(--color-primary)]"
            />
            <span className="font-semibold text-gray-700 text-sm">Alle</span>
          </label>

          {/* Member list */}
          <div className="space-y-2 max-h-52 overflow-y-auto mb-4 pr-1">
            {members.map(member => {
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
                  <span className="text-gray-800 text-sm font-medium">{name}</span>
                </label>
              );
            })}
          </div>

          {/* Message */}
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Legg til en melding (valgfritt)..."
            className="w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:border-[var(--color-primary)] mb-4"
              style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text)" }}
          />

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSend}
              disabled={sending || selected.size === 0}
              className="btn-primary flex-1 py-2 text-sm disabled:cursor-not-allowed"
            >
              {sending ? 'Sender...' : `Send til ${selected.size > 0 ? selected.size : ''} ${selected.size === 1 ? 'person' : 'personer'}`}
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
  );
};

export default RecommendModal;
