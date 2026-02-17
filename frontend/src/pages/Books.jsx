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
  const [status, setStatus] = useState('');
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
  }, [search, status, genre, sort]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
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
    setStatus('');
    setGenre('');
    setSort('newest');
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fadeIn">
          <div>
            <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">
              ✨ Book Collection
            </h1>
            <p className="text-white/90 text-lg font-medium">
              📚 {books.length} {books.length === 1 ? 'book' : 'books'} in our collection
            </p>
          </div>

          {isAdmin && (
            <Link to="/books/new" className="btn-accent">
              ✨ Add New Book
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="container-gradient mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🔍 Search Books
              </label>
              <input
                type="text"
                placeholder="Search by title, author, or description..."
                value={search}
                onChange={handleSearchChange}
                className="input-field"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                📖 Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input-field"
              >
                <option value="">All Status</option>
                <option value="to-read">To Read</option>
                <option value="currently-reading">Currently Reading</option>
                <option value="read">Read</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🔄 Sort By
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="input-field"
              >
                <option value="newest">Newest First</option>
                <option value="title">Title A-Z</option>
                <option value="author">Author A-Z</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Genre Filter */}
            <div className="md:col-span-3">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🎨 Genre
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setGenre('')}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all transform hover:scale-105 ${
                    genre === ''
                      ? 'text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:shadow-md'
                  }`}
                  style={genre === '' ? { background: 'linear-gradient(135deg, #667eea, #764ba2)' } : {}}
                >
                  All Genres
                </button>
                {availableGenres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenre(g)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all transform hover:scale-105 ${
                      genre === g
                        ? 'text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:shadow-md'
                    }`}
                    style={genre === g ? { background: 'linear-gradient(135deg, #667eea, #764ba2)' } : {}}
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
                ✖️ Clear All
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
