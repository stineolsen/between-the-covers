import { useState } from "react";
import { useAuth } from "../../contexts/useAuth";
import UserAvatar from "../common/UserAvatar";

const CommentCard = ({ comment, onEdit, onDelete }) => {
  const { user, isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(comment.content);

  const isOwner = user && comment.user && comment.user._id === user._id;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("nb-NO", { year: "numeric", month: "long", day: "numeric" });

  const handleSave = () => {
    if (!content.trim()) return;
    onEdit(comment._id, content);
    setIsEditing(false);
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--color-sunken)" }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <UserAvatar
            user={comment.user}
            className="w-9 h-9 rounded-full text-sm font-bold flex-shrink-0"
          />
          <div>
            <p className="font-bold text-gray-900 text-sm">
              {comment.user?.displayName || comment.user?.username || "Anonym"}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>{formatDate(comment.createdAt)}</p>
          </div>
        </div>

        {(isOwner || isAdmin) && !isEditing && (
          <div className="flex items-center gap-1">
            {isOwner && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs px-2 py-1 rounded-full font-semibold hover:bg-[var(--color-blue-tint)] transition-all"
                style={{ color: "var(--color-blue)" }}
              >
                ✏️
              </button>
            )}
            <button
              onClick={() => onDelete(comment._id)}
              className="text-xs px-2 py-1 rounded-full font-semibold text-red-600 hover:bg-red-50 transition-all"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="mt-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
            rows={2}
            className="w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:border-[var(--color-primary)]"
            style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text)" }}
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleSave} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{ background: "var(--color-primary)" }}>
              Lagre
            </button>
            <button
              onClick={() => {
                setContent(comment.content);
                setIsEditing(false);
              }}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border hover:bg-[var(--color-sunken)] transition-colors"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
            >
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700 whitespace-pre-line">{comment.content}</p>
      )}
    </div>
  );
};

export default CommentCard;
