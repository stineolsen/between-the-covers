import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { userBooksApi } from '../api/userBooksApi';
import { booksApi } from '../api/booksApi';

const toInputDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
};

const DateEditor = ({ initialDate, onSave, onCancel }) => {
  const inputRef = useRef(null);
  const handleSave = () => {
    const val = inputRef.current?.value;
    if (val) onSave(val);
  };
  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="date"
        defaultValue={toInputDate(initialDate)}
        max={new Date().toISOString().split('T')[0]}
        className="border border-purple-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:border-purple-500"
        autoFocus
      />
      <button
        onClick={handleSave}
        className="text-green-500 hover:text-green-700 font-bold text-lg leading-none"
        title="Lagre"
      >✓</button>
      <button
        onClick={onCancel}
        className="text-gray-400 hover:text-red-500 font-bold text-lg leading-none"
        title="Avbryt"
      >✕</button>
    </div>
  );
};

const ReadingHistory = () => {
  const [readBooks, setReadBooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, this-year, last-year
  const [editingDateId, setEditingDateId] = useState(null);
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    fetchReadingData();
  }, []);

  const fetchReadingData = async () => {
    try {
      setLoading(true);
      // Fetch books with status='read'
      const booksData = await userBooksApi.getUserBooks({ status: 'read' });
      setReadBooks(booksData.userBooks || []);

      // Fetch reading statistics
      const statsData = await userBooksApi.getReadingStats();
      setStats(statsData.stats || {});
    } catch (error) {
      console.error('Greide ikke hente lesedata:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleDateChange = async (userBookId, newDate) => {
    setDateError('');
    try {
      await userBooksApi.updateFinishedDate(userBookId, newDate);
      setReadBooks(prev =>
        prev.map(ub => ub._id === userBookId ? { ...ub, finishedAt: newDate } : ub)
      );
    } catch (err) {
      console.error('Greide ikke oppdatere dato:', err);
      setDateError('Greide ikke lagre dato. Prøv igjen.');
    }
  };

  // Filter books by year
  const getFilteredBooks = () => {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    const beforeYear = lastYear - 1;

    switch (filter) {
      case 'this-year':
        return readBooks.filter(userBook => {
          const finishedDate = new Date(userBook.finishedAt);
          return finishedDate.getFullYear() === currentYear;
        });
      case 'last-year':
        return readBooks.filter(userBook => {
          const finishedDate = new Date(userBook.finishedAt);
          return finishedDate.getFullYear() === lastYear;
        });
      case "before": 
      return readBooks.filter(userBook => {
          const finishedDate = new Date(userBook.finishedAt);
          return finishedDate.getFullYear() <= beforeYear;
        });
      default:
        return readBooks;
    }
  };

  const filteredBooks = getFilteredBooks();

  // Group books by year
  const booksByYear = filteredBooks.reduce((acc, userBook) => {
    if (!userBook.finishedAt) return acc;
    const year = new Date(userBook.finishedAt).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(userBook);
    return acc;
  }, {});

  const years = Object.keys(booksByYear).sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="animate-spin rounded-full h-20 w-20 mx-auto mb-4" style={{ border: '4px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}></div>
          <p className="text-white text-xl font-bold drop-shadow-lg">✨ Laster lesehistorikk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="text-5xl font-bold gradient-text mb-3 drop-shadow-lg">📚 Historikk</h1>
          <p className="hidden sm:text-xl text-gray font-medium max-w-2xl mx-auto">
            Her kan du holde styr på bøker du har lest, både i bokklubben og ellers. 
          </p>
        </div>

        {/* Reading Statistics */}
        {stats && (
          <div className="grid grid-cols-3 flex justify-center gap-4 py-5 gap-6 mb-8 animate-fadeIn">
            <div
              className="p-6 rounded-2xl text-white shadow-lg transform transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}
            >
              <div className="text-5xl mb-2">✅</div>
              <div className="text-4xl font-bold mb-1">{stats.read || 0}</div>
              <div className="text-lg font-medium">Bøker lest</div>
            </div>

            <div
              className="p-6 rounded-2xl text-white shadow-lg transform transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}
            >
              <div className="text-5xl mb-2">📖</div>
              <div className="text-4xl font-bold mb-1">{stats['currently-reading'] || 0}</div>
              <div className="text-lg font-medium">Leser nå</div>
            </div>

            <div
              className="p-6 rounded-2xl text-white shadow-lg transform transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
            >
              <div className="text-5xl mb-2">📚</div>
              <div className="text-4xl font-bold mb-1">{stats['to-read'] || 0}</div>
              <div className="text-lg font-medium">TBR</div>
            </div>
          </div>
        )}

        {/* Date save error */}
        {dateError && (
          <div className="mb-4 p-3 rounded-xl text-white text-center font-bold animate-fadeIn" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            {dateError}
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex justify-center gap-4 mb-8 animate-fadeIn">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
              filter === 'all' ? 'text-white' : 'bg-white text-gray-700 hover:shadow-xl'
            }`}
            style={filter === 'all' ? { background: 'linear-gradient(135deg, #667eea, #764ba2)' } : {}}
          >
            All tid
          </button>
          <button
            onClick={() => setFilter('this-year')}
            className={`px-6 py-2 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
              filter === 'this-year' ? 'text-white' : 'bg-white text-gray-700 hover:shadow-xl'
            }`}
            style={filter === 'this-year' ? { background: 'linear-gradient(135deg, #667eea, #764ba2)' } : {}}
          >
            {new Date().getFullYear()}
          </button>
          <button
            onClick={() => setFilter('last-year')}
            className={`px-6 py-2 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
              filter === 'last-year' ? 'text-white' : 'bg-white text-gray-700 hover:shadow-xl'
            }`}
            style={filter === 'last-year' ? { background: 'linear-gradient(135deg, #667eea, #764ba2)' } : {}}
          >
            {new Date().getFullYear() - 1}
          </button>

        <button
            onClick={() => setFilter('before')}
            className={`px-6 py-2 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
              filter === 'before' ? 'text-white' : 'bg-white text-gray-700 hover:shadow-xl'
            }`}
            style={filter === 'before' ? { background: 'linear-gradient(135deg, #667eea, #764ba2)' } : {}}
          >
            Før {new Date().getFullYear() - 1}
          </button>
        </div>

        {/* Books Timeline */}
        {filteredBooks.length === 0 ? (
          <div
            className="container-gradient text-center py-20 animate-fadeIn"
            style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))' }}
          >
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-3xl font-bold gradient-text mb-3">Ingen bøker lest enda</h2>
            <p className="text-gray-600 text-lg mb-6">
              Begynn din leseferd i dag! Marker bøker som lest for å se dem her.
            </p>
            <Link to="/books" className="btn-primary inline-block">
              Sjekk ut bøkene
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {years.map(year => (
              <div key={year} className="animate-fadeIn">
                {/* Year Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="text-white px-6 py-1 rounded-full font-bold text-2xl shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}
                  >
                    {year}
                  </div>
                  <div className="flex-1 h-1 rounded" style={{ background: 'linear-gradient(90deg, #667eea, transparent)' }}></div>
                  <div className="text-gray-300 font-bold text-lg bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                    {booksByYear[year].length} {booksByYear[year].length === 1 ? 'bok' : 'bøker'}
                  </div>
                </div>

                {/* Books Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {booksByYear[year].map(userBook => {
                    const book = userBook.book;
                    if (!book) return null;

                    const coverUrl = book.coverImage ? booksApi.getCoverUrl(book.coverImage) : null;
                    const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"%3E%3Crect fill="%23e5e7eb" width="300" height="450"/%3E%3Ctext x="50%25" y="50%25" font-size="24" text-anchor="middle" alignment-baseline="middle" font-family="monospace, sans-serif" fill="%239ca3af"%3ENo Cover%3C/text%3E%3C/svg%3E';

                    return (
                      <div
                        key={userBook._id}
                        className="container-gradient group transform transition-all hover:scale-105 px-5 py-5"
                      >
                        <Link to={`/books/${book._id}`} className="block">
                          {/* Book Cover */}
                          <div className="relative mb-4 overflow-hidden rounded-2xl">
                            <img
                              src={coverUrl || placeholderImage}
                              alt={book.title}
                              className="w-full h-64 object-cover transform transition-transform group-hover:scale-110"
                            />
                            <div
                              className="absolute top-2 right-2 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
                              style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}
                            >
                              ✓ Lest
                            </div>
                          </div>

                          {/* Book Info */}
                          <h3 className="text-lg font-bold gradient-text mb-1 line-clamp-2 group-hover:underline">
                            {book.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3">{book.author}</p>
                        </Link>

                        {/* Finished Date — editable */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <span>📅</span>
                          {editingDateId === userBook._id ? (
                            <DateEditor
                              initialDate={userBook.finishedAt}
                              onSave={(date) => {
                                handleDateChange(userBook._id, date);
                                setEditingDateId(null);
                              }}
                              onCancel={() => setEditingDateId(null)}
                            />
                          ) : (
                            <>
                              <span>
                                {userBook.finishedAt
                                  ? new Date(userBook.finishedAt).toLocaleDateString('nb-NO', { year: 'numeric', month: 'long', day: 'numeric' })
                                  : '–'}
                              </span>
                              <button
                                onClick={() => setEditingDateId(userBook._id)}
                                className="text-gray-400 hover:text-purple-600 transition-colors"
                                title="Endre dato"
                              >
                                ✏️
                              </button>
                            </>
                          )}
                        </div>

                        {/* Rating */}
                        {book.averageRating > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex text-yellow-400">
                              {'★'.repeat(Math.round(book.averageRating))}
                              {'☆'.repeat(5 - Math.round(book.averageRating))}
                            </div>
                            <span className="text-gray-600">{book.averageRating.toFixed(1)}</span>
                          </div>
                        )}

                        {/* Notes Preview */}
                        {userBook.notes && (
                          <div className="mt-3 p-3 rounded-xl bg-white/50">
                            <p className="text-xs text-gray-700 italic line-clamp-2">
                              "{userBook.notes}"
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Motivational Section */}
        {readBooks.length > 0 && (
          <div
            className="mt-12 p-8 rounded-2xl text-center animate-fadeIn"
            style={{ background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.1), rgba(245, 87, 108, 0.1))' }}
          >
            <h3 className="text-2xl font-bold gradient-text mb-3">🎉 Fortsett lesing!</h3>
            <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed text-lg">
              Du har lest {readBooks.length} {readBooks.length === 1 ? 'bok' : 'bøker'}! Hver bok er et nytt eventyr!
              Fortsett det gode arbeidet og fortsett å utforske nye bøker og sjangere! 
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingHistory;
