import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import StarRating from './StarRating';

const ReviewCard = ({ review, onLike, onEdit, onDelete, showSpoilers = false }) => {
  const { user, isAdmin } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullContent, setShowFullContent] = useState(!review.spoilers || showSpoilers);

  const isOwner = user && review.user && review.user._id === user._id;
  const isLiked = review.likes && review.likes.some(id => id === user?._id);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
            {review.user?.displayName?.[0] || review.user?.username?.[0] || '?'}
          </div>

          {/* User Info */}
          <div>
            <p className="font-bold text-gray-900">
              {review.user?.displayName || review.user?.username || 'Anonymous'}
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
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white' }}
            >
              ✏️ Rediger
            </button>
          )}
          {(isOwner || isAdmin) && onDelete && (
            <button
              onClick={() => onDelete(review._id)}
              className="text-sm px-4 py-2 rounded-full font-bold transition-all transform hover:scale-110"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' }}
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
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          {review.title}
        </h3>
      )}

      {/* Spoiler Warning */}
      {review.spoilers && !showFullContent && (
        <div className="p-4 rounded-2xl mb-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))' }}>
          <p className="text-red-700 font-bold mb-2">⚠️ Denne anmeldelsen inneholder spoilere!</p>
          <button
            onClick={handleToggleSpoilers}
            className="btn-accent"
          >
            Vis anmeldelse
          </button>
        </div>
      )}

      {/* Content */}
      {showFullContent && (
        <>
          <div className="text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
            {review.content}
          </div>

          {review.spoilers && (
            <button
              onClick={handleToggleSpoilers}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium mb-4"
            >
              Skjul spoilere
            </button>
          )}
        </>
      )}

      {/* Reading Date */}
      {review.readingDate && (
        <p className="text-sm text-gray-600 mb-4">
          📅 Lesedato {formatDate(review.readingDate)}
        </p>
      )}

      {/* Footer - Like Button */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={() => onLike && onLike(review._id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all transform hover:scale-110 ${
            isLiked
              ? 'text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={isLiked ? { background: 'linear-gradient(135deg, #f093fb, #f5576c)' } : {}}
        >
          <span className="text-xl">{isLiked ? '❤️' : '🤍'}</span>
          <span>{review.likeCount || 0} {review.likeCount === 1 ? 'liker' : 'likes'}</span>
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
