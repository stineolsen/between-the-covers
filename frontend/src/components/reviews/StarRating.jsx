import { useState } from "react";
import { useId } from "react";

const STAR_PATH =
  "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

const SIZE_MAP = { sm: 18, md: 24, lg: 32, xl: 40 };

const StarSVG = ({ fill, px, gradId }) => {
  const pct = Math.round(fill * 100);
  return (
    <svg width={px} height={px} viewBox="0 0 24 24" style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
          <stop offset={`${pct}%`} stopColor="#facc15" />
          <stop offset={`${pct}%`} stopColor="#d1d5db" />
        </linearGradient>
      </defs>
      <path fill={`url(#${gradId})`} d={STAR_PATH} />
    </svg>
  );
};

const StarRating = ({
  rating = 0,
  onRatingChange = null,
  readOnly = false,
  size = "md",
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const uid = useId().replace(/:/g, "s");
  const px = SIZE_MAP[size] || 24;
  const displayRating = hoverRating || rating;

  const getValueFromEvent = (e, starIndex) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    const quarter = Math.max(0.25, Math.min(1, Math.ceil(fraction * 4) / 4));
    return (starIndex - 1) + quarter;
  };

  const getFill = (starIndex) =>
    Math.min(1, Math.max(0, displayRating - (starIndex - 1)));

  const formatRating = (r) => {
    if (r === Math.floor(r)) return `${r}`;
    return r.toFixed(2).replace(/0$/, "");
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onMouseMove={(e) => !readOnly && setHoverRating(getValueFromEvent(e, star))}
          onMouseLeave={() => !readOnly && setHoverRating(0)}
          onClick={(e) => {
            if (!readOnly && onRatingChange) {
              onRatingChange(getValueFromEvent(e, star));
            }
          }}
          className={`p-0 border-0 bg-transparent focus:outline-none ${
            readOnly ? "cursor-default" : "cursor-pointer"
          }`}
          aria-label={`${star} ${star === 1 ? "stjerne" : "stjerner"}`}
        >
          <StarSVG fill={getFill(star)} px={px} gradId={`${uid}-${star}`} />
        </button>
      ))}
      {!readOnly && hoverRating > 0 && (
        <span className="ml-2 text-gray-600 font-medium text-sm">
          {formatRating(hoverRating)} {hoverRating === 1 ? "stjerne" : "stjerner"}
        </span>
      )}
    </div>
  );
};

export default StarRating;
