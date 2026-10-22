import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { booksApi } from "../../api/booksApi";
import commentsApi from "../../api/commentsApi";
import BookCoverFallback from "../common/BookCoverFallback";
import CommentThread from "./CommentThread";

const BookRankingRow = ({ listId, entry, rank, canEdit, onRemove }) => {
  const book = entry.book;
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(null);

  // Known before the thread is ever expanded, so the collapsed row can show
  // a count badge instead of nothing - CommentThread itself keeps this in
  // sync afterward via onCountChange once it's actually mounted.
  useEffect(() => {
    commentsApi
      .getComments({ listId, bookId: book._id })
      .then((data) => setCommentCount(data.count ?? (data.comments || []).length))
      .catch(() => setCommentCount(0));
  }, [listId, book._id]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: book._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: "var(--color-card)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
      className="rounded-2xl overflow-hidden"
    >
      <div className="flex items-center gap-3 p-3">
        {canEdit && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing hover:opacity-70 transition-opacity text-xl leading-none flex-shrink-0 touch-none"
            style={{ color: "var(--color-text-faint)" }}
            title="Dra for å endre rekkefølge"
          >
            ⠿
          </button>
        )}

        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: "var(--color-primary-solid)" }}
        >
          {rank}
        </div>

        <Link to={`/books/${book._id}`} className="flex-shrink-0">
          <BookCoverFallback
            src={book.coverImage ? booksApi.getCoverUrl(book.coverImage) : null}
            alt={book.title}
            className="w-10 h-14 object-cover rounded-md"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            to={`/books/${book._id}`}
            className="font-bold text-sm hover:text-[var(--color-primary)] transition-colors block truncate"
            style={{ color: "var(--color-text)" }}
          >
            {book.title}
          </Link>
          <p className="text-xs truncate" style={{ color: "var(--color-text-faint)" }}>{book.author}</p>
        </div>

        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-lg hover:bg-[var(--color-sunken)] transition-all"
          style={{ color: "var(--color-text-muted)" }}
          title="Kommentarer"
        >
          <span>💬</span>
          {commentCount > 0 && <span className="font-bold">{commentCount}</span>}
          <span className="hidden sm:inline">{showComments ? "Skjul" : "Kommenter"}</span>
        </button>

        {canEdit && (
          <button
            onClick={() => onRemove(book._id)}
            className="flex-shrink-0 text-xs font-semibold px-2 py-1.5 rounded-lg hover:bg-[var(--color-terracotta-tint)] transition-all"
            style={{ color: "var(--color-terracotta)" }}
            title="Fjern fra listen"
          >
            🗑️
          </button>
        )}
      </div>

      {showComments && (
        <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: "var(--color-border)" }}>
          <CommentThread listId={listId} bookId={book._id} onCountChange={setCommentCount} />
        </div>
      )}
    </div>
  );
};

export default BookRankingRow;
