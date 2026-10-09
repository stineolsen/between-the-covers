import { useEffect, useState } from "react";
import badgesApi from "../../api/badgesApi";

// General-purpose badge shelf - not advent-specific, shows whatever the
// badge system has awarded this user (door-count badges today, season/
// year-round achievements later).
const ProfileBadgeShelf = ({ userId }) => {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    if (!userId) return;
    badgesApi
      .getUserBadges(userId)
      .then((data) => setBadges(data.badges || []))
      .catch(() => {});
  }, [userId]);

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-3">
      {badges.map((badge) => (
        <span
          key={badge._id}
          title={badge.description}
          className="px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ background: "var(--color-gold-tint)", color: "var(--color-secondary-deep)" }}
        >
          {badge.name}
        </span>
      ))}
    </div>
  );
};

export default ProfileBadgeShelf;
