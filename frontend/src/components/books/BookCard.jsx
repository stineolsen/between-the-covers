import { Link } from 'react-router-dom';
import { booksApi } from '../../api/booksApi';
import BookCoverFallback from '../common/BookCoverFallback';

const BookCard = ({ book }) => {
  const coverUrl = book.coverImage ? booksApi.getCoverUrl(book.coverImage) : null;

  return (
    <Link
      to={`/books/${book._id}`}
      className="group block bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2 hover:scale-105 animate-fadeIn"
    >
      {/* Book Cover */}
      <div className="relative aspect-[2/3] overflow-hidden" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
        <BookCoverFallback
          src={coverUrl}
          alt={book.title}
          category="book"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 group-hover:rotate-2"
        />

        {/* Bokklubb Month Badge */}
        {book.bookclubMonth && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            📅 {book.bookclubMonth}
          </div>
        )}

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
