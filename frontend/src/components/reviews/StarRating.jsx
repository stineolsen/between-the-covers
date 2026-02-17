import { useState } from 'react';

const StarRating = ({ rating = 0, onRatingChange = null, readOnly = false, size = 'md' }) => {
  const [hoverRating, setHoverRating] = useState(0);

  // Size classes
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  };

  const handleClick = (value) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (!readOnly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          disabled={readOnly}
          className={`
            ${sizeClasses[size]}
            ${readOnly ? 'cursor-default' : 'cursor-pointer transform transition-all hover:scale-125'}
            ${star <= displayRating ? 'text-yellow-400' : 'text-gray-300'}
            focus:outline-none
          `}
          aria-label={`${star} stjerne${star > 1 ? 'r' : ''}`}
        >
          {star <= displayRating ? '★' : '☆'}
        </button>
      ))}
      {!readOnly && hoverRating > 0 && (
        <span className="ml-2 text-gray-600 font-medium animate-fadeIn">
          {hoverRating} {hoverRating === 1 ? 'stjerne' : 'stjerner'}
        </span>
      )}
    </div>
  );
};

export default StarRating;
