import { useState, useEffect } from 'react';
import bookRequestApi from '../../api/bookRequestApi';

const FORMAT_LABELS = { ebook: '📱 E-bok', audiobook: '🎧 Lydbok' };

const MyRequestsFeed = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookRequestApi.getMine()
      .then(data => setRequests(data.requests || []))
      .catch(err => console.error('Klarte ikke laste forespørsler:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleDismiss = async (id) => {
    try {
      await bookRequestApi.dismiss(id);
      setRequests(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      console.error('Klarte ikke trekke tilbake forespørsel:', err);
    }
  };

  if (loading || requests.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto mt-4 sm:mt-6 animate-fadeIn">
      <h2 className="text-lg sm:text-xl font-bold gradient-text mb-3 sm:mb-4">📋 Dine bokforespørsler</h2>
      <div className="space-y-2 sm:space-y-3">
        {requests.map(req => (
          <div
            key={req._id}
            className="flex items-center justify-between gap-3 sm:gap-4 rounded-2xl p-3 sm:p-4"
            style={{ background: 'var(--gradient-secondary)' }}
          >
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 truncate">{req.title}</p>
              <p className="text-sm truncate" style={{ color: "var(--color-text-faint)" }}>{req.author}</p>
              {req.formats && req.formats.length > 0 && (
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {req.formats.map(f => (
                    <span key={f} className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "var(--color-wine-tint)", color: "var(--color-primary)" }}>
                      {FORMAT_LABELS[f] || f}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 flex items-center gap-2">
              {req.status === 'added' ? (
                <span className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "var(--color-sage-tint)", color: "var(--color-sage)" }}>
                  ✅ Lagt til i biblioteket
                </span>
              ) : (
                <>
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "var(--color-gold-tint)", color: "var(--color-secondary)" }}>
                    ⏳ Venter på svar
                  </span>
                  <button
                    onClick={() => handleDismiss(req._id)}
                    title="Trekk tilbake forespørsel"
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--color-terracotta-tint)] hover:text-[var(--color-terracotta)] transition-colors"
                    style={{ color: "var(--color-text-faint)" }}
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyRequestsFeed;
