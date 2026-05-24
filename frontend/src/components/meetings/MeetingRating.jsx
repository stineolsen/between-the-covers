import { useState, useEffect } from "react";
import StarRating from "../reviews/StarRating";
import { reviewsApi } from "../../api/reviewsApi";

const MeetingRating = ({ bookId, bookTitle }) => {
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

  const handleRatingChange = (newRating) => {
    setRating(newRating);
    setSaved(false);
  };

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
    <div
      className="mt-4 pt-4 border-t border-white/30"
    >
      <p className="text-sm font-bold text-white/90 mb-2">
        ⭐ {existingReview ? "Din vurdering" : "Vurder denne boken"}
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <StarRating
          rating={rating}
          onRatingChange={handleRatingChange}
          size="md"
        />
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
        {saved && (
          <span className="text-sm font-bold text-white/80">✓ Lagret!</span>
        )}
      </div>
    </div>
  );
};

export default MeetingRating;
