import { useState } from "react";
import { usersApi } from "../../api/usersApi";
import { avatarColor } from "./avatarColor";

// Shows a member's real uploaded profile picture when they have one, falling
// back to a colored initial (same per-name color everywhere) otherwise.
// className controls sizing/shape (e.g. "w-10 h-10 rounded-full") and is
// applied to both the <img> and the fallback so callers don't need to
// branch on whether an avatar exists.
const UserAvatar = ({ user, className = "", title }) => {
  const [imageError, setImageError] = useState(false);

  const name = user?.displayName || user?.username || "";
  const src = user?.avatar ? usersApi.getAvatarUrl(user.avatar) : null;

  if (!src || imageError) {
    return (
      <div
        title={title}
        className={`${className} flex items-center justify-center font-bold text-white`}
        style={{ background: avatarColor(name) }}
      >
        {name ? name[0].toUpperCase() : "?"}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      title={title}
      className={`${className} object-cover`}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
};

export default UserAvatar;
