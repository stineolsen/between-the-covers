import { useState } from "react";
import { useAuth } from "../../contexts/useAuth";
import StarRating from "./StarRating";
import UserAvatar from "../common/UserAvatar";

const ReviewCard = ({
  review,
  onLike,
  onEdit,
  onDelete,
  showSpoilers = false,
}) => {
  const { user, isAdmin } = useAuth();
  const [showFullContent, setShowFullContent] = useState(
    !review.spoilers || showSpoilers,
  );

  const isOwner = user && review.user && review.user._id === user._id;
  const isLiked = review.likes && review.likes.some((id) => id === user?._id);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("nb-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleToggleSpoilers = () => {
    setShowFullContent(!showFullContent);
  };

  return (
    <div className="container-gradient animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* User Avatar */}
          <UserAvatar user={review.user} className="w-12 h-12 rounded-full text-2xl font-bold" />

          {/* User Info */}
          <div>
            <p className="font-bold" style={{ color: "var(--color-text)" }}>
              {review.user?.displayName || review.user?.username || "Anonymous"}
            </p>
            <p className="text-sm text-gray-600">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isOwner && onEdit && (
            <button
              onClick={() => onEdit(review)}
              className="text-sm px-4 py-2 rounded-full font-bold transition-all transform hover:scale-110"
              style={{
                background: "var(--color-blue-solid)",
                color: "white",
              }}
            >
              ✏️ Rediger
            </button>
          )}
          {(isOwner || isAdmin) && onDelete && (
            <button
              onClick={() => onDelete(review._id)}
              className="text-sm px-4 py-2 rounded-full font-bold transition-all transform hover:scale-110"
              style={{
                background: "var(--color-terracotta-solid)",
                color: "white",
              }}
            >
              🗑️ Slett
            </button>
          )}
        </div>
      </div>

      {/* Rating */}
      <div className="mb-3">
        <StarRating rating={review.rating} readOnly size="md" />
      </div>

      {/* Title */}
      {review.title && (
        <h3 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>{review.title}</h3>
      )}

      {/* Spoiler Warning */}
      {review.spoilers && !showFullContent && (
        <div
          className="p-4 rounded-2xl mb-4 text-center"
          style={{ background: "var(--color-terracotta-tint)" }}
        >
          <p className="font-bold mb-2" style={{ color: "var(--color-terracotta)" }}>
            ⚠️ Denne anmeldelsen inneholder spoilere!
          </p>
          <button onClick={handleToggleSpoilers} className="btn-accent">
            Vis anmeldelse
          </button>
        </div>
      )}

      {/* Content */}
      {showFullContent && (
        <>
          <div className="leading-relaxed mb-4 whitespace-pre-line" style={{ color: "var(--color-text-muted)" }}>
            {review.content}
          </div>

          {review.spoilers && (
            <button
              onClick={handleToggleSpoilers}
              className="text-sm font-medium mb-4"
              style={{ color: "var(--color-text-muted)" }}
            >
              Skjul spoilere
            </button>
          )}
        </>
      )}

      {/* Reading Date */}
      {review.readingDate && (
        <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
          📅 Lesedato {formatDate(review.readingDate)}
        </p>
      )}

      {/* Footer - Like Button */}
      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
        <button
          onClick={() => onLike && onLike(review._id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all transform hover:scale-110 ${
            isLiked ? "text-white" : ""
          }`}
          style={
            isLiked
              ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }
              : { background: "var(--color-sunken)", color: "var(--color-text-muted)" }
          }
        >
          <span className="text-xl">{isLiked ? "❤️" : "🤍"}</span>
          <span>
            {review.likeCount || 0} {review.likeCount === 1 ? "liker" : "likes"}
          </span>
        </button>

        {review.updatedAt && review.updatedAt !== review.createdAt && (
          <p className="text-xs text-gray-500">
            Redigert {formatDate(review.updatedAt)}
          </p>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
