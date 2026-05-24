import { useState, useEffect } from "react";
import StarRating from "../reviews/StarRating";
import { reviewsApi } from "../../api/reviewsApi";
import { usersApi } from "../../api/usersApi";
import { useAuth } from "../../contexts/AuthContext";

// Own rating widget — used by all members including admin
const OwnRating = ({ bookId }) => {
  const [existingReview, setExistingReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewsApi.getUserReviewForBook(bookId)
      .then(data => {
        if (data.review) {
          setExistingReview(data.review);
          setRating(data.review.rating);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookId]);

  const handleSave = async () => {
    if (!rating || saving) return;
    setSaving(true);
    try {
      if (existingReview) {
        const data = await reviewsApi.updateReview(existingReview._id, { rating });
        setExistingReview(data.review);
      } else {
        const data = await reviewsApi.createReview({ bookId, rating });
        setExistingReview(data.review);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save rating:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  const hasChanged = rating !== (existingReview?.rating || 0);

  return (
    <div>
      <p className="text-sm font-bold text-white/90 mb-2">
        ⭐ {existingReview ? "Din vurdering" : "Vurder denne boken"}
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <StarRating rating={rating} onRatingChange={(r) => { setRating(r); setSaved(false); }} size="md" />
        {rating > 0 && hasChanged && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-full text-sm font-bold transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.25)", color: "white" }}
          >
            {saving ? "Lagrer..." : "Lagre"}
          </button>
        )}
        {saved && <span className="text-sm font-bold text-white/80">✓ Lagret!</span>}
      </div>
    </div>
  );
};

// Admin section — set ratings for all members
const AdminRatings = ({ bookId }) => {
  const [members, setMembers] = useState([]);
  const [ratings, setRatings] = useState({});   // userId → rating number
  const [reviewMap, setReviewMap] = useState({}); // userId → review object
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      usersApi.getMembers(),
      reviewsApi.getReviews({ bookId }),
    ])
      .then(([membersData, reviewsData]) => {
        const memberList = membersData.members || [];
        setMembers(memberList);

        const rMap = {};
        const ratingInit = {};
        (reviewsData.reviews || []).forEach(r => {
          const uid = r.user?._id || r.user;
          if (uid) {
            rMap[uid] = r;
            ratingInit[uid] = r.rating;
          }
        });
        setReviewMap(rMap);
        setRatings(ratingInit);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [open, bookId]);

  const handleSave = async (userId) => {
    const rating = ratings[userId];
    if (!rating || saving[userId]) return;
    setSaving(prev => ({ ...prev, [userId]: true }));
    try {
      const data = await reviewsApi.adminSetRating(bookId, userId, rating);
      setReviewMap(prev => ({ ...prev, [userId]: data.review }));
      setSaved(prev => ({ ...prev, [userId]: true }));
      setTimeout(() => setSaved(prev => ({ ...prev, [userId]: false })), 3000);
    } catch (err) {
      console.error("Admin rating error:", err);
    } finally {
      setSaving(prev => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/20">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white transition-colors"
      >
        <span>{open ? "▾" : "▸"}</span>
        Fyll inn for andre medlemmer
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {loading ? (
            <p className="text-white/60 text-sm">Laster...</p>
          ) : members.length === 0 ? (
            <p className="text-white/60 text-sm">Ingen medlemmer funnet.</p>
          ) : (
            members.map(member => {
              const uid = member._id;
              const currentRating = ratings[uid] || 0;
              const existingRating = reviewMap[uid]?.rating || 0;
              const hasChanged = currentRating !== existingRating;
              const name = member.displayName || member.username;

              return (
                <div key={uid} className="flex items-center gap-3 flex-wrap">
                  <span className="text-white text-sm font-semibold w-32 truncate flex-shrink-0">
                    {name}
                  </span>
                  <StarRating
                    rating={currentRating}
                    onRatingChange={r => setRatings(prev => ({ ...prev, [uid]: r }))}
                    size="sm"
                  />
                  {currentRating > 0 && hasChanged && (
                    <button
                      onClick={() => handleSave(uid)}
                      disabled={saving[uid]}
                      className="px-3 py-1 rounded-full text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                      style={{ background: "rgba(255,255,255,0.25)", color: "white" }}
                    >
                      {saving[uid] ? "..." : "Lagre"}
                    </button>
                  )}
                  {saved[uid] && (
                    <span className="text-xs font-bold text-white/70">✓</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const MeetingRating = ({ bookId }) => {
  const { isAdmin } = useAuth();

  return (
    <div className="mt-4 pt-4 border-t border-white/30">
      <OwnRating bookId={bookId} />
      {isAdmin && <AdminRatings bookId={bookId} />}
    </div>
  );
};

export default MeetingRating;
