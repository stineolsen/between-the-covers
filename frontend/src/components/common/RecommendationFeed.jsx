import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import recommendationApi from '../../api/recommendationApi';
import { userBooksApi } from '../../api/userBooksApi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AVATAR_COLORS = [
  'linear-gradient(135deg, #7c3aed, #a855f7)',
  'linear-gradient(135deg, #db2777, #f472b6)',
  'linear-gradient(135deg, #0891b2, #22d3ee)',
  'linear-gradient(135deg, #059669, #34d399)',
  'linear-gradient(135deg, #d97706, #fbbf24)',
];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const RecommendationFeed = () => {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    recommendationApi.getMine()
      .then(data => setRecs(data.recommendations || []))
      .catch(err => console.error('Klarte ikke laste anbefalinger:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleDismiss = async (id) => {
    try {
      await recommendationApi.dismiss(id);
      setRecs(prev => prev.filter(r => r._id !== id));
    } catch {
      // silent
    }
  };

  const handleAddToList = async (rec) => {
    setAddingId(rec._id);
    try {
      await userBooksApi.setBookStatus(rec.book._id, 'to-read');
      setRecs(prev => prev.filter(r => r._id !== rec._id));
    } catch {
      // silent
    } finally {
      setAddingId(null);
    }
  };

  if (loading || recs.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto mt-6 animate-fadeIn">
      <h2 className="text-xl font-bold gradient-text mb-4">📬 Anbefalt til deg</h2>
      <div className="space-y-3">
        {recs.map(rec => {
          const sender = rec.from;
          const senderName = sender?.displayName || sender?.username || 'Ukjent';
          const book = rec.book;

          return (
            <div
              key={rec._id}
              className="flex items-center gap-4 rounded-2xl p-4"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(251,113,133,0.14))' }}
            >
              {/* Book cover */}
              <Link to={`/books/${book?._id}`} className="flex-shrink-0">
                {book?.coverImage ? (
                  <img
                    src={`${API_URL}/uploads/books/${book.coverImage}`}
                    alt={book.title}
                    className="w-14 h-20 object-cover rounded-lg shadow"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-14 h-20 rounded-lg bg-purple-100 flex items-center justify-center text-2xl">📖</div>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link to={`/books/${book?._id}`} className="font-bold text-gray-800 hover:text-purple-700 transition-colors block truncate">
                  {book?.title || 'Ukjent bok'}
                </Link>
                {book?.author && (
                  <p className="text-sm text-gray-500 truncate">{book.author}</p>
                )}

                {/* Sender */}
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: avatarColor(senderName) }}
                  >
                    {senderName[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-600">
                    <span className="font-semibold">{senderName}</span> anbefaler denne
                  </span>
                </div>

                {/* Message */}
                {rec.message && (
                  <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">
                    "{rec.message}"
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleAddToList(rec)}
                    disabled={addingId === rec._id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
                  >
                    {addingId === rec._id ? '...' : '+ Legg til leserlisten'}
                  </button>
                </div>
              </div>

              {/* Dismiss */}
              <button
                onClick={() => handleDismiss(rec._id)}
                className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors text-xl font-bold leading-none self-start"
                title="Avvis"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationFeed;
