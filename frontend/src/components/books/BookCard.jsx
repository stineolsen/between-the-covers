import { Link } from 'react-router-dom';
import { booksApi } from '../../api/booksApi';
import BookCoverFallback from '../common/BookCoverFallback';

const BookCard = ({ book }) => {
  const coverUrl = book.coverImage ? booksApi.getCoverUrl(book.coverImage) : null;

  return (
    <Link
      to={`/books/${book._id}`}
      className="group block bg-white rounded-2xl overflow-hidden animate-fadeIn transition-all duration-300"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 28px rgba(107, 91, 149, 0.18)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'}
    >
      {/* Book Cover */}
      <div className="relative aspect-[2/3] overflow-hidden bg-primary-25">
        <BookCoverFallback
          src={coverUrl}
          alt={book.title}
          category="book"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Bokklubb Month Badge */}
        {book.bookclubMonth && (
          <div
            className="absolute top-2 right-2 text-white text-xs font-semibold px-2 py-0.5 rounded-full hidden sm:block"
            style={{ background: 'var(--color-primary)', opacity: 0.92 }}
          >
            {book.bookclubMonth}
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="p-2 sm:p-4">
        <h3 className="font-bold text-xs sm:text-base text-gray-900 line-clamp-2 mb-0.5 sm:mb-1 group-hover:text-purple-700 transition-colors">
          {book.title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2 line-clamp-1">{book.author}</p>

        {/* Series*/}
        {book.series && (
          <p className="block text-xs text-purple-600 font-medium mb-2">
            {book.series}{book.seriesNumber ? ` #${book.seriesNumber}` : ''}
          </p>
        )}

        {/* Rating — hidden on mobile */}
        {book.averageRating > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-sm mb-3">
            <span className="text-yellow-400 tracking-tight">
              {'★'.repeat(Math.round(book.averageRating))}
              <span className="text-gray-300">{'★'.repeat(5 - Math.round(book.averageRating))}</span>
            </span>
            <span className="text-gray-500 text-xs">{book.averageRating.toFixed(1)} ({book.reviewCount})</span>
          </div>
        )}

        {/* Genres — hidden on mobile */}
        {book.genres && book.genres.length > 0 && (
          <div className="hidden sm:flex flex-wrap gap-1.5">
            {book.genres.slice(0, 2).map((genre, index) => (
              <span
                key={index}
                className="text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
                style={{ border: '1.5px solid #6B5B95', color: '#6B5B95' }}
              >
                {genre}
              </span>
            ))}
            {book.genres.length > 2 && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium text-gray-400 border border-gray-200">
                +{book.genres.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default BookCard;
