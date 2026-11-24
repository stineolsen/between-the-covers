import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { booksApi } from "../../api/booksApi";

// Grid of book covers that shows one row until the arrow is pressed.
// The grid is 4 / 6 / 8 columns (mobile / sm / md), so "one row" means the
// first 4 / 6 / 8 covers - the rest are hidden with matching breakpoints.
//
// books: [{ book }]   (UserBook-shaped; entries without a book are skipped)
const rowClass = (i) => {
  if (i < 4) return "";
  if (i < 6) return "hidden sm:block";
  if (i < 8) return "hidden md:block";
  return "hidden";
};

const CollapsibleBookShelf = ({ title, books = [], loading = false, emptyText, className = "", defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const gridId = useId();
  const list = books.filter((b) => b?.book);
  // More than the smallest row (4) - on wide screens a 5-book shelf has
  // nothing to expand, but the arrow is harmless there
  const canExpand = list.length > 4;

  return (
    <div className={`container-gradient ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!canExpand}
        aria-expanded={canExpand ? open : undefined}
        aria-controls={gridId}
        className="w-full flex items-center justify-between gap-3 mb-4 text-left disabled:cursor-default"
      >
        <h2 className="text-xl font-bold gradient-text">
          {title} ({list.length})
        </h2>
        {canExpand && (
          <span className="flex items-center gap-1.5 text-sm font-bold flex-shrink-0" style={{ color: "var(--color-primary)" }}>
            {open ? "Vis færre" : "Vis alle"}
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 transition-transform duration-200"
              style={{ transform: open ? "rotate(180deg)" : "none" }}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        )}
      </button>

      {loading ? (
        <div className="flex justify-center py-6">
          <div
            className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--color-wine-tint)", borderTopColor: "transparent" }}
          />
        </div>
      ) : list.length === 0 ? (
        emptyText && <p className="text-text-faint text-sm text-center py-6">{emptyText}</p>
      ) : (
        <div id={gridId} className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {list.map(({ book }, i) => {
            const cover = booksApi.getCoverUrl(book.coverImage);
            return (
              <Link
                key={book._id}
                to={`/books/${book._id}`}
                title={`${book.title} — ${book.author}`}
                className={`group block ${open ? "" : rowClass(i)}`}
              >
                <div
                  className="aspect-[2/3] rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-shadow"
                  style={{ background: "var(--color-sunken)" }}
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt={book.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2" style={{ background: "var(--color-wine-tint)" }}>
                      <span className="text-xs text-center text-text-faint font-medium line-clamp-3 leading-tight">{book.title}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CollapsibleBookShelf;
