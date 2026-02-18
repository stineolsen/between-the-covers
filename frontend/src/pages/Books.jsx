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

  // Filter states
  const [search, setSearch] = useState('');
  const [bookclubOnly, setBookclubOnly] = useState(false);
  const [audiobookOnly, setAudiobookOnly] = useState(false);
  const [genre, setGenre] = useState('');
  const [sort, setSort] = useState('newest');

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
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fadeIn">
          <div>
            <h1 className="text-5xl font-bold gradient-text mb-3">
              📚 Boksamling
            </h1>
            <p className="text-gray-700 text-lg">
              {books.length} {books.length === 1 ? 'bok' : 'bøker'} i vår samling
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
                📅 Bare bokklubb bøker
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
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    genre === ''
                      ? 'text-white shadow-md'
                      : 'bg-white text-gray-700 hover:shadow-md border border-gray-200'
                  }`}
                  style={genre === '' ? { background: 'var(--color-primary)' } : {}}
                >
                  Alle sjangere
                </button>
                {availableGenres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenre(g)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      genre === g
                        ? 'text-white shadow-md'
                        : 'bg-white text-gray-700 hover:shadow-md border border-gray-200'
                    }`}
                    style={genre === g ? { background: 'var(--color-primary)' } : {}}
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
