import { Link } from "react-router-dom";
import { booksApi } from "../../api/booksApi";
import BookCoverFallback from "../common/BookCoverFallback";
import UserAvatar from "../common/UserAvatar";

const ListCard = ({ list }) => {
  const ownerName = list.owner?.displayName || list.owner?.username || "Ukjent";
  const covers = (list.books || []).slice(0, 4);

  return (
    <Link
      to={`/lists/${list._id}`}
      className="group block bg-white rounded-2xl overflow-hidden animate-fadeIn transition-all duration-300"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
    >
      {/* Cover collage */}
      <div className="grid grid-cols-4 aspect-[4/2] bg-primary-25 overflow-hidden">
        {covers.length > 0 ? (
          covers.map((entry, i) => (
            <BookCoverFallback
              key={entry.book?._id || i}
              src={entry.book?.coverImage ? booksApi.getCoverUrl(entry.book.coverImage) : null}
              alt={entry.book?.title}
              className="w-full h-full object-cover"
            />
          ))
        ) : (
          <div className="col-span-4 flex items-center justify-center text-4xl bg-purple-50">📋</div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-purple-700 transition-colors">
            {list.title}
          </h3>
          <span
            className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold"
            style={
              list.visibility === "public"
                ? { background: "rgba(16,185,129,0.12)", color: "#059669" }
                : { background: "rgba(107,91,149,0.12)", color: "#6b5b95" }
            }
          >
            {list.visibility === "public" ? "🌍 Offentlig" : "🔒 Privat"}
          </span>
        </div>

        {list.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{list.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserAvatar
              user={list.owner}
              className="w-6 h-6 rounded-full text-xs font-bold flex-shrink-0"
            />
            <span className="text-xs text-gray-600">{ownerName}</span>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            {list.books?.length || 0} {list.books?.length === 1 ? "bok" : "bøker"}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ListCard;
