import { useState } from "react";

const BookCoverFallback = ({ src, alt, className = "", category = "book" }) => {
  const [imageError, setImageError] = useState(false);

  // Emoji based on category
  const getEmoji = () => {
    if (category === "book") return "📚";
    if (category === "merchandise") return "🎁";
    return "🛍️";
  };

  // If no src or image failed to load, show fallback
  if (!src || imageError) {
    return (
      <div
        className={`${className} flex items-center justify-center text-6xl`}
        style={{
          background:
            "linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(251, 113, 133, 0.2))",
        }}
      >
        {getEmoji()}
      </div>
    );
  }

  // Try to load the image
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
};

export default BookCoverFallback;
