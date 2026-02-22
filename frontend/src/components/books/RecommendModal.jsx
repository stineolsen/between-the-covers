import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { usersApi } from '../../api/usersApi';
import recommendationApi from '../../api/recommendationApi';

const AVATAR_COLORS = [
  'linear-gradient(135deg, #7c3aed, #a855f7)',
  'linear-gradient(135deg, #db2777, #f472b6)',
  'linear-gradient(135deg, #0891b2, #22d3ee)',
  'linear-gradient(135deg, #059669, #34d399)',
  'linear-gradient(135deg, #d97706, #fbbf24)',
];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

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
      style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(251,113,133,0.14))' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg gradient-text">Anbefal denne boken til...</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
          title="Lukk"
        >✕</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-7 h-7 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <p className="text-gray-500 text-center py-4">Ingen andre medlemmer å anbefale til.</p>
      ) : (
        <>
          {/* Select all */}
          <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="w-4 h-4 accent-purple-600"
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
                  className="flex items-center gap-3 cursor-pointer select-none rounded-xl px-3 py-2 hover:bg-white/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(member._id)}
                    onChange={() => toggleMember(member._id)}
                    className="w-4 h-4 accent-purple-600 flex-shrink-0"
                  />
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: avatarColor(name) }}
                  >
                    {name[0]?.toUpperCase()}
                  </div>
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
            className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm resize-none focus:outline-none focus:border-purple-400 bg-white/70 mb-4"
          />

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSend}
              disabled={sending || selected.size === 0}
              className="flex-1 py-2 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
            >
              {sending ? 'Sender...' : `Send til ${selected.size > 0 ? selected.size : ''} ${selected.size === 1 ? 'person' : 'personer'}`}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
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
