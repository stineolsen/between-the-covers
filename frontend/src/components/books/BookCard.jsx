import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { booksApi } from "../../api/booksApi";
import { userBooksApi } from "../../api/userBooksApi";
import BookCoverFallback from "../common/BookCoverFallback";

const BookCard = ({ book, userBookEntry, onStatusChange }) => {
  const coverUrl = book.coverImage ? booksApi.getCoverUrl(book.coverImage) : null;
  const hasLinks = !!(book.libraryLinks?.audiobook || book.libraryLinks?.ebook || book.calibreDownloadLink);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const longPressTimer = useRef(null);

  const currentStatus = userBookEntry?.status;
  const userBookId = userBookEntry?._id;
  const isOwned = userBookEntry?.owned;

  const handleStatusClick = async (e, status) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      if (currentStatus === status) {
        await userBooksApi.removeUserBook(userBookId);
        onStatusChange?.(book._id, null, null);
      } else {
        const data = await userBooksApi.setBookStatus(book._id, status);
        onStatusChange?.(book._id, status, data.userBook?._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
      setShowOverlay(false);
    }
  };

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => setShowOverlay(true), 500);
  };
  const cancelLongPress = () => clearTimeout(longPressTimer.current);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
    >
      <Link
        to={`/books/${book._id}`}
        className="group block bg-white rounded-2xl overflow-hidden animate-fadeIn transition-all duration-300"
        style={{
          boxShadow: showOverlay ? "0 8px 28px rgba(107, 91, 149, 0.18)" : "0 2px 12px rgba(0,0,0,0.07)",
          opacity: hasLinks ? 1 : 0.5,
        }}
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
              style={{ background: "var(--color-primary)", opacity: 0.92 }}
            >
              {book.bookclubMonth}
            </div>
          )}

          {/* Owned badge */}
          {isOwned && !showOverlay && (
            <div className="absolute top-1.5 left-1.5 text-base leading-none" title="På bokhyllen din">
              📚
            </div>
          )}

          {/* Hover / long-press overlay */}
          {showOverlay && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3"
              style={{ background: "rgba(0,0,0,0.55)" }}
            >
              <button
                onClick={(e) => handleStatusClick(e, "to-read")}
                disabled={isUpdating}
                className="w-full py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
                style={
                  currentStatus === "to-read"
                    ? { background: "linear-gradient(135deg, #667eea, #764ba2)", color: "white" }
                    : { background: "rgba(255,255,255,0.92)", color: "#7c3aed" }
                }
              >
                {currentStatus === "to-read" ? "✓ TBR" : "+ TBR"}
              </button>
              <button
                onClick={(e) => handleStatusClick(e, "read")}
                disabled={isUpdating}
                className="w-full py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
                style={
                  currentStatus === "read"
                    ? { background: "linear-gradient(135deg, #10b981, #14b8a6)", color: "white" }
                    : { background: "rgba(255,255,255,0.92)", color: "#059669" }
                }
              >
                {currentStatus === "read" ? "✓ Lest" : "+ Lest"}
              </button>
            </div>
          )}

          {/* Small status badge when not hovering */}
          {currentStatus && !showOverlay && (
            <div className="absolute bottom-1.5 left-1.5">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold text-white"
                style={{
                  background:
                    currentStatus === "read"
                      ? "rgba(16,185,129,0.88)"
                      : currentStatus === "to-read"
                      ? "rgba(124,58,237,0.88)"
                      : "rgba(59,130,246,0.88)",
                }}
              >
                {currentStatus === "read" ? "✓ Lest" : currentStatus === "to-read" ? "TBR" : "Leser"}
              </span>
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="p-2 sm:p-4">
          <h3 className="font-bold text-xs sm:text-base text-gray-900 line-clamp-2 mb-0.5 sm:mb-1 group-hover:text-purple-700 transition-colors">
            {book.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2 line-clamp-1">
            {book.author}
          </p>

          {book.series && (
            <p className="block text-xs text-purple-600 font-medium mb-2">
              {book.series}
              {book.seriesNumber ? ` #${book.seriesNumber}` : ""}
            </p>
          )}

          {book.averageRating > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-sm mb-3">
              <span className="text-yellow-400 tracking-tight">
                {"★".repeat(Math.round(book.averageRating))}
                <span className="text-gray-300">
                  {"★".repeat(5 - Math.round(book.averageRating))}
                </span>
              </span>
              <span className="text-gray-500 text-xs">
                {book.averageRating.toFixed(1)} ({book.reviewCount})
              </span>
            </div>
          )}

          {book.genres && book.genres.length > 0 && (
            <div className="hidden sm:flex flex-wrap gap-1.5">
              {book.genres.slice(0, 2).map((genre, index) => (
                <span
                  key={index}
                  className="text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
                  style={{ border: "1.5px solid #6B5B95", color: "#6B5B95" }}
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
    </div>
  );
};

export default BookCard;
