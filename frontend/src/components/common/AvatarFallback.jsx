import { useState } from 'react';

const AvatarFallback = ({ src, alt, className = '', name = '' }) => {
  const [imageError, setImageError] = useState(false);

  // Get initials from name
  const getInitials = () => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // If no src or image failed to load, show fallback with initials
  if (!src || imageError) {
    return (
      <div
        className={`${className} flex items-center justify-center font-bold text-white`}
        style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)'
        }}
      >
        {getInitials()}
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

export default AvatarFallback;
