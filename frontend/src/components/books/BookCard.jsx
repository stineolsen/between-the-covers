import { Link } from 'react-router-dom';
import { booksApi } from '../../api/booksApi';

const BookCard = ({ book }) => {
  const coverUrl = book.coverImage ? booksApi.getCoverUrl(book.coverImage) : null;

  // Default placeholder image (can be replaced with an actual placeholder)
  const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"%3E%3Crect fill="%23e5e7eb" width="200" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="20" text-anchor="middle" alignment-baseline="middle" font-family="monospace, sans-serif" fill="%239ca3af"%3ENo Cover%3C/text%3E%3C/svg%3E';

  const getStatusColor = (status) => {
    switch (status) {
      case 'read':
        return 'bg-gradient-to-r from-green-400 to-teal-500';
      case 'currently-reading':
        return 'bg-gradient-to-r from-pink-400 to-purple-500';
      case 'to-read':
        return 'bg-gradient-to-r from-blue-400 to-indigo-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'read':
        return 'Read';
      case 'currently-reading':
        return 'Reading';
      case 'to-read':
        return 'To Read';
      default:
        return status;
    }
  };

  return (
    <Link
      to={`/books/${book._id}`}
      className="group block bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2 hover:scale-105 animate-fadeIn"
    >
      {/* Book Cover */}
      <div className="relative aspect-[2/3] overflow-hidden" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
        <img
          src={coverUrl || placeholderImage}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 group-hover:rotate-2"
        />

        {/* Status Badge */}
        <div className={`absolute top-3 right-3 ${getStatusColor(book.status)} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse`}>
          {getStatusText(book.status)}
        </div>

        {/* Hover Overlay with Gradient */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5" style={{ background: 'linear-gradient(to top, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.8) 50%, transparent)' }}>
          <p className="text-white text-sm font-medium leading-relaxed animate-slideIn">
            {book.description || 'No description available'}
          </p>
        </div>
      </div>

      {/* Book Info */}
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2 group-hover:gradient-text transition-all">
          {book.title}
        </h3>
        <p className="text-sm text-gray-600 font-medium mb-3">by {book.author}</p>

        {/* Rating */}
        {book.averageRating > 0 && (
          <div className="flex items-center gap-2 text-sm mb-3">
            <div className="flex text-yellow-400 text-lg">
              {'★'.repeat(Math.round(book.averageRating))}
              {'☆'.repeat(5 - Math.round(book.averageRating))}
            </div>
            <span className="text-gray-600 font-semibold">
              {book.averageRating.toFixed(1)} <span className="text-gray-400">({book.reviewCount})</span>
            </span>
          </div>
        )}

        {/* Genres */}
        {book.genres && book.genres.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {book.genres.slice(0, 2).map((genre, index) => (
              <span
                key={index}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:scale-110"
                style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)', color: 'white' }}
              >
                {genre}
              </span>
            ))}
            {book.genres.length > 2 && (
              <span className="text-xs text-white font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400">
                +{book.genres.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default BookCard;
