import { useState } from 'react';
import { useToast } from '../../contexts/useToast';
import bookRequestApi from '../../api/bookRequestApi';

const FORMAT_OPTIONS = [
  { value: 'ebook', label: '📱 E-bok' },
  { value: 'audiobook', label: '🎧 Lydbok' },
];

const RequestBookModal = ({ onClose }) => {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [formats, setFormats] = useState([]);
  const [sending, setSending] = useState(false);

  const toggleFormat = (val) => {
    setFormats(prev =>
      prev.includes(val) ? prev.filter(f => f !== val) : [...prev, val]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      toast.error('Fyll inn tittel og forfatter');
      return;
    }
    setSending(true);
    try {
      await bookRequestApi.create(title, author, formats);
      toast.success('Forespørsel sendt! 📚');
      onClose();
    } catch {
      toast.error('Klarte ikke sende forespørsel');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div
        className="w-full max-w-md rounded-2xl p-6 animate-fadeIn shadow-2xl"
        style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold gradient-text">📬 Be om en bok</h2>
          <button onClick={onClose} className="text-xl font-bold leading-none hover:opacity-70 transition-opacity" style={{ color: "var(--color-text-faint)" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tittel *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Boktittel"
              maxLength={200}
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Forfatter *</label>
            <input
              type="text"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="Forfatternavn"
              maxLength={200}
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Format (valgfritt)</label>
            <div className="flex gap-3">
              {FORMAT_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer border-2 transition-all text-sm font-medium select-none"
                  style={
                    formats.includes(opt.value)
                      ? { borderColor: "var(--color-primary)", background: "var(--color-wine-tint)", color: "var(--color-primary)" }
                      : { borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-muted)" }
                  }
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formats.includes(opt.value)}
                    onChange={() => toggleFormat(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={sending} className="btn-primary flex-1">
              {sending ? 'Sender...' : 'Send forespørsel'}
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

export default RequestBookModal;
