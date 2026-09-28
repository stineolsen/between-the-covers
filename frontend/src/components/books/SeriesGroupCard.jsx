import { useState } from "react";
import { booksApi } from "../../api/booksApi";
import BookCoverFallback from "../common/BookCoverFallback";
import BookCard from "./BookCard";

// One grid cell standing in for every book in a series. Collapsed, it shows
// a fanned stack of covers; clicking it opens every book in the series (in
// seriesNumber order - groupBySeries already sorted `books`) in a modal over
// the page, rather than reflowing the grid.
const SeriesGroupCard = ({ seriesName, books, genres = [], userBookMap, onStatusChange }) => {
  const [open, setOpen] = useState(false);
  const stackCovers = books.slice(0, 3);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[85vh] rounded-2xl p-5 sm:p-6 animate-fadeIn shadow-2xl flex flex-col"
            style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 mb-4 flex-shrink-0">
              <h2 className="text-xl font-bold gradient-text">
                📚 {seriesName}{" "}
                <span className="text-base font-normal opacity-70">
                  ({books.length} {books.length === 1 ? "bok" : "bøker"})
                </span>
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-xl font-bold leading-none hover:opacity-70 transition-opacity flex-shrink-0"
                style={{ color: "var(--color-text-faint)" }}
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto">
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {books.map((book) => (
                  <BookCard
                    key={book._id}
                    book={book}
                    userBookEntry={userBookMap[book._id]}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(true)}
        className="group flex flex-col h-full w-full text-left rounded-2xl overflow-hidden animate-fadeIn transition-all duration-300"
        style={{ background: "var(--color-card)", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
      >
        <div
          className="relative aspect-[2/3] overflow-hidden flex-shrink-0"
          style={{ background: "linear-gradient(135deg, var(--color-wine-tint), var(--color-gold-tint))" }}
        >
          {stackCovers.map((book, i) => {
            const mid = (stackCovers.length - 1) / 2;
            const offset = (mid - i) * 18;
            const rotate = (mid - i) * 6;
            return (
              <div
                key={book._id}
                className="absolute rounded-md overflow-hidden"
                style={{
                  width: "60%",
                  aspectRatio: "2 / 3",
                  left: "50%",
                  bottom: "8%",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
                  transform: `translateX(calc(-50% + ${offset}px)) rotate(${rotate}deg)`,
                  // Book 1 (index 0) sits on top of the fan; later books recede behind it.
                  zIndex: stackCovers.length - i,
                }}
              >
                <BookCoverFallback
                  src={book.coverImage ? booksApi.getCoverUrl(book.coverImage) : null}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>
            );
          })}
          <span
            className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: "var(--color-primary-solid)" }}
          >
            {books.length}
          </span>
        </div>
        <div className="p-2 sm:p-4 flex-1">
          <h3
            className="font-bold text-xs sm:text-base line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors"
            style={{ color: "var(--color-text)" }}
          >
            📚 {seriesName}
          </h3>
          <p className="text-xs sm:text-sm mt-0.5 mb-2" style={{ color: "var(--color-text-faint)" }}>
            {books.length} {books.length === 1 ? "bok" : "bøker"} i serien
          </p>

          {genres.length > 0 && (
            <div className="hidden sm:flex flex-wrap gap-1.5">
              {genres.slice(0, 2).map((genre, index) => (
                <span
                  key={index}
                  className="text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
                  style={{ border: "1.5px solid var(--color-primary)", color: "var(--color-primary)" }}
                >
                  {genre}
                </span>
              ))}
              {genres.length > 2 && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium border" style={{ color: "var(--color-text-faint)", borderColor: "var(--color-border)" }}>
                  +{genres.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </button>
    </>
  );
};

export default SeriesGroupCard;
