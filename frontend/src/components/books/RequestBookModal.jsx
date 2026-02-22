import { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
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
        style={{ background: 'linear-gradient(135deg, #fff 80%, rgba(124,58,237,0.06))' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold gradient-text">📬 Be om en bok</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">✕</button>
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer border-2 transition-all text-sm font-medium select-none ${
                    formats.includes(opt.value)
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'
                  }`}
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
            <button
              type="submit"
              disabled={sending}
              className="flex-1 py-2.5 rounded-xl text-white font-bold transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
            >
              {sending ? 'Sender...' : 'Send forespørsel'}
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

export default RequestBookModal;
