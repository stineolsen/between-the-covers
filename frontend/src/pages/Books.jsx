import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { booksApi } from '../api/booksApi';
import { useAuth } from '../contexts/AuthContext';
import BookGrid from '../components/books/BookGrid';

const Books = () => {
  const { isAdmin } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states - restored from sessionStorage so filters persist when navigating back
  const savedFilters = JSON.parse(sessionStorage.getItem('bookFilters') || '{}');
  const [search, setSearch] = useState(savedFilters.search || '');
  const [bookclubOnly, setBookclubOnly] = useState(savedFilters.bookclubOnly || false);
  const [audiobookOnly, setAudiobookOnly] = useState(savedFilters.audiobookOnly || false);
  const [genre, setGenre] = useState(savedFilters.genre || '');
  const [sort, setSort] = useState(savedFilters.sort || 'newest');

  // Save filters to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem('bookFilters', JSON.stringify({ search, bookclubOnly, audiobookOnly, genre, sort }));
  }, [search, bookclubOnly, audiobookOnly, genre, sort]);

  // Available genres (you can make this dynamic by fetching from books)
  const availableGenres = [
    'Fiction',
    'Non-Fiction',
    'Mystery',
    'Thriller',
    'Romance',
    'Science Fiction',
    'Fantasy',
    'Biography',
    'History',
    'Self-Help'
  ];

  useEffect(() => {
    fetchBooks();
  }, [search, bookclubOnly, audiobookOnly, genre, sort]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (search) params.search = search;
      if (bookclubOnly) params.bookclubOnly = 'true';
      if (audiobookOnly) params.audiobookOnly = 'true';
      if (genre) params.genre = genre;
      if (sort) params.sort = sort;

      const data = await booksApi.getBooks(params);
      setBooks(data.books);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load books');
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const clearFilters = () => {
    setSearch('');
    setBookclubOnly(false);
    setAudiobookOnly(false);
    setGenre('');
    setSort('newest');
    sessionStorage.removeItem('bookFilters');
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fadeIn">
          <div>
            <h1 className="text-5xl font-bold gradient-text mb-3">
              📚 Bibilotek
            </h1>
            <p className="text-gray-700 text-lg">
              {books.length} {books.length === 1 ? 'bok' : 'bøker'} i vårt bibilotek
            </p>
          </div>

          {isAdmin && (
            <Link to="/books/new" className="btn-accent">
              ✨ Legg til ny bok
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="container-gradient mb-8">
          <div className="grid md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🔍 Søk etter bøker
              </label>
              <input
                type="text"
                placeholder="Søk etter tittel, forfatter eller serie..."
                value={search}
                onChange={handleSearchChange}
                className="input-field"
              />
            </div>

            {/* Bokklubb Filter */}
            <div className="flex items-center gap-2 p-4 rounded-xl bg-white hover:shadow-md transition-all">
              <input
                type="checkbox"
                id="bookclubOnly"
                checked={bookclubOnly}
                onChange={(e) => setBookclubOnly(e.target.checked)}
                className="w-5 h-5 rounded cursor-pointer"
              />
              <label htmlFor="bookclubOnly" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                📅 Klubbens bøker
              </label>
            </div>

            {/* Audiobook Filter */}
            <div className="flex items-center gap-2 p-4 rounded-xl bg-white hover:shadow-md transition-all">
              <input
                type="checkbox"
                id="audiobookOnly"
                checked={audiobookOnly}
                onChange={(e) => setAudiobookOnly(e.target.checked)}
                className="w-5 h-5 rounded cursor-pointer"
              />
              <label htmlFor="audiobookOnly" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                🎧 Lydbøker
              </label>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🔄 Sorter etter
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="input-field"
              >
                <option value="newest">Nyeste først</option>
                <option value="title">Tittel A-Z</option>
                <option value="author">Forfatter A-Z</option>
                <option value="rating">Høyest rated</option>
              </select>
            </div>

            {/* Genre Filter */}
            <div className="md:col-span-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🎨 Sjanger
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setGenre('')}
                  className="px-2.5 py-1 rounded-full text-sm font-semibold transition-all"
                  style={genre === ''
                    ? { background: 'var(--color-primary)', color: 'white', border: '1.5px solid var(--color-primary)' }
                    : { background: 'white', color: '#6B5B95', border: '1.5px solid #6B5B95' }}
                >
                  Alle sjangere
                </button>
                {availableGenres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenre(g)}
                    className="px-2.5 py-1 rounded-full text-sm font-semibold transition-all"
                    style={genre === g
                      ? { background: 'var(--color-primary)', color: 'white', border: '1.5px solid var(--color-primary)' }
                      : { background: 'white', color: '#6B5B95', border: '1.5px solid #6B5B95' }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="text-sm font-bold px-4 py-2 rounded-full bg-white hover:shadow-md transition-all transform hover:scale-105"
                style={{ color: '#f5576c' }}
              >
                ✖️ Fjern alt filtrering
              </button>
            </div>
          </div>
        </div>

        {/* Books Grid */}
        <BookGrid books={books} loading={loading} error={error} />
      </div>
    </div>
  );
};

export default Books;
