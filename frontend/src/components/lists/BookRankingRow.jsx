import { useState } from "react";
import { Link } from "react-router-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { booksApi } from "../../api/booksApi";
import BookCoverFallback from "../common/BookCoverFallback";
import CommentThread from "./CommentThread";

const BookRankingRow = ({ listId, entry, rank, canEdit, onRemove }) => {
  const book = entry.book;
  const [showComments, setShowComments] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: book._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={{ ...style, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }} className="bg-white rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        {canEdit && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 text-xl leading-none flex-shrink-0 touch-none"
            title="Dra for å endre rekkefølge"
          >
            ⠿
          </button>
        )}

        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: "var(--color-primary)" }}
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
          <Link to={`/books/${book._id}`} className="font-bold text-sm text-gray-900 hover:text-purple-700 transition-colors block truncate">
            {book.title}
          </Link>
          <p className="text-xs text-gray-500 truncate">{book.author}</p>
        </div>

        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
        >
          💬 {showComments ? "Skjul" : "Kommenter"}
        </button>

        {canEdit && (
          <button
            onClick={() => onRemove(book._id)}
            className="flex-shrink-0 text-xs font-semibold px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all"
            title="Fjern fra listen"
          >
            🗑️
          </button>
        )}
      </div>

      {showComments && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100">
          <CommentThread listId={listId} bookId={book._id} />
        </div>
      )}
    </div>
  );
};

export default BookRankingRow;
