import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import badgesApi from "../../api/badgesApi";
import Bookmark from "../badges/Bookmark";

// Advent door-count badges awarded before lesemerker existed have no family
const LEGACY_ADVENT = { family: "advent", color: "#b5182f", icon: "gift" };

// The member's lesemerker as a shelf of bookmarks: the highest badge they
// hold in each family, so the shelf stays tidy as badges pile up.
const ProfileBadgeShelf = ({ userId, isOwn = false }) => {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    if (!userId) return;
    badgesApi
      .getUserBadges(userId)
      .then((data) => setBadges(data.badges || []))
      .catch(() => {});
  }, [userId]);

  if (badges.length === 0) return null;

  const best = new Map();
  for (const raw of badges) {
    const badge = raw.family ? raw : { ...raw, ...LEGACY_ADVENT, label: raw.name?.match(/\d+/)?.[0] || "" };
    const current = best.get(badge.family);
    if (!current || (badge.order ?? 0) > (current.order ?? 0)) best.set(badge.family, badge);
  }
  const shelf = [...best.values()];

  return (
    <div className="w-full max-w-xl mt-4">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          Lesemerker · {badges.length}
        </p>
        {isOwn && (
          <Link to="/merker" className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>
            Se alle →
          </Link>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {shelf.map((badge) => (
          <Bookmark
            key={badge._id}
            color={badge.color}
            icon={badge.icon}
            label={badge.label}
            top={badge.top}
            width={40}
            title={`${badge.name}: ${badge.description}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProfileBadgeShelf;
