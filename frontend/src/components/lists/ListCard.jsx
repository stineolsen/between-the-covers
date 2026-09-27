import { Link } from "react-router-dom";
import { booksApi } from "../../api/booksApi";
import BookCoverFallback from "../common/BookCoverFallback";
import UserAvatar from "../common/UserAvatar";

const ListCard = ({ list }) => {
  const ownerName = list.owner?.displayName || list.owner?.username || "Ukjent";
  // Render more covers than any card width could show, then let the card's
  // own overflow-hidden clip whatever doesn't fit — fills wide cards instead
  // of stopping at 4 and leaving blank space.
  const covers = (list.books || []).slice(0, 12);

  return (
    <Link
      to={`/lists/${list._id}`}
      className="group block rounded-2xl overflow-hidden animate-fadeIn transition-all duration-300"
      style={{ background: "var(--color-card)", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
    >
      {/* Cover row — small portrait covers, like books fanned on a shelf */}
      <div
        className="flex items-end gap-1.5 p-3"
        style={{ background: "var(--color-sunken)" }}
      >
        {covers.length > 0 ? (
          covers.map((entry, i) => (
            <div key={entry.book?._id || i} className="w-11 aspect-[2/3] rounded-sm overflow-hidden shadow-sm flex-shrink-0">
              <BookCoverFallback
                src={entry.book?.coverImage ? booksApi.getCoverUrl(entry.book.coverImage) : null}
                alt={entry.book?.title}
                className="w-full h-full object-cover"
              />
            </div>
          ))
        ) : (
          <div className="w-full flex items-center justify-center text-4xl py-4">📋</div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold group-hover:opacity-80 transition-opacity" style={{ color: "var(--color-text)" }}>
            {list.title}
          </h3>
          <span
            className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold"
            style={
              list.visibility === "public"
                ? { background: "var(--color-sage-tint)", color: "var(--color-sage)" }
                : { background: "var(--color-wine-tint)", color: "var(--color-primary)" }
            }
          >
            {list.visibility === "public" ? "🌍 Offentlig" : "🔒 Privat"}
          </span>
        </div>

        {list.description && (
          <p className="text-sm line-clamp-2 mb-3" style={{ color: "var(--color-text-muted)" }}>{list.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserAvatar
              user={list.owner}
              className="w-6 h-6 rounded-full text-xs font-bold flex-shrink-0"
            />
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{ownerName}</span>
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--color-text-faint)" }}>
            {list.books?.length || 0} {list.books?.length === 1 ? "bok" : "bøker"}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ListCard;
