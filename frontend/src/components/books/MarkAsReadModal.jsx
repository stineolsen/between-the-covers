import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "../../contexts/useToast";
import { booksApi } from "../../api/booksApi";
import { userBooksApi } from "../../api/userBooksApi";
import { reviewsApi } from "../../api/reviewsApi";
import StarRating from "../reviews/StarRating";
import BookCoverFallback from "../common/BookCoverFallback";

const pad = (n) => String(n).padStart(2, "0");
const toInputDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Opens right after a book is marked as "Lest": when you finished it, stars
// and an optional comment. The read status is already saved, so skipping
// just keeps today's date. A stars-only rating stays out of the activity
// feed (the read status is already there); with a comment it's a normal
// review.
const MarkAsReadModal = ({ book, userBookId, onClose, onSaved }) => {
  const toast = useToast();
  const today = toInputDate(new Date());
  const yesterday = toInputDate(new Date(Date.now() - 86400000));
  // Read earlier, exact date unknown: park it on 1 January - "I fjor" in last
  // year, "Før <last year>" two years back (the same date Bokwrapped parks
  // books on). Keeps them out of this year's stats and Bokwrapped.
  const thisYear = new Date().getFullYear();
  const lastYear = `${thisYear - 1}-01-01`;
  const beforeLastYear = `${thisYear - 2}-01-01`;

  const [date, setDate] = useState(today);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [spoilers, setSpoilers] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const dialogRef = useRef(null);

  // Prefill from an earlier review of this book, if any
  useEffect(() => {
    reviewsApi
      .getUserReviewForBook(book._id)
      .then((data) => {
        if (!data?.review) return;
        setExistingReview(data.review);
        setRating(data.review.rating || 0);
        setContent(data.review.content || "");
        setSpoilers(!!data.review.spoilers);
      })
      .catch(() => {});
  }, [book._id]);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const handleSave = async () => {
    const text = content.trim();
    if (text && !rating) {
      setError("Gi stjerner for å lagre kommentaren.");
      return;
    }
    if (!date || date > today) {
      setError("Velg en dato som ikke er fram i tid.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await userBooksApi.updateFinishedDate(userBookId, date);
      if (rating) {
        const reviewData = { rating, content: text, readingDate: date, spoilers: text ? spoilers : false };
        if (existingReview) {
          await reviewsApi.updateReview(existingReview._id, reviewData);
        } else {
          await reviewsApi.createReview({ ...reviewData, bookId: book._id, hideFromFeed: !text });
        }
      }
      toast.success(rating ? "Lagret - takk for vurderingen! ⭐" : "Lesedatoen er lagret ✓");
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Klarte ikke lagre. Prøv igjen.");
    } finally {
      setSaving(false);
    }
  };

  const coverUrl = book.coverImage ? booksApi.getCoverUrl(book.coverImage) : null;
  const chip = (active) => ({
    background: active ? "var(--color-primary-solid)" : "var(--color-sunken)",
    color: active ? "#fff" : "var(--color-text)",
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(20, 12, 14, 0.55)" }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mark-read-title"
        tabIndex={-1}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl animate-fadeIn max-h-[92dvh] overflow-y-auto focus:outline-none"
        style={{ background: "var(--color-card)", color: "var(--color-text)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 aspect-[2/3] rounded-md overflow-hidden flex-shrink-0 shadow">
            <BookCoverFallback src={coverUrl} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-sage)" }}>
              ✓ Markert som lest
            </p>
            <h2 id="mark-read-title" className="text-lg font-semibold leading-snug truncate" style={{ fontFamily: "'Fraunces', serif" }}>
              {book.title}
            </h2>
            {book.author && (
              <p className="text-sm truncate" style={{ color: "var(--color-text-muted)" }}>
                {book.author}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ color: "var(--color-text-faint)" }}
            aria-label="Lukk"
          >
            ×
          </button>
        </div>

        {/* Date */}
        <label htmlFor="mark-read-date" className="block text-sm font-bold mb-2">
          Når leste du den ferdig?
        </label>
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {[
            [today, "I dag"],
            [yesterday, "I går"],
            [lastYear, "I fjor"],
            [beforeLastYear, `Før ${thisYear - 1}`],
          ].map(([value, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setDate(value)}
              className="px-3 py-1.5 rounded-full text-sm font-semibold"
              style={chip(date === value)}
              aria-pressed={date === value}
            >
              {label}
            </button>
          ))}
          <input
            id="mark-read-date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="input-field py-1.5 w-auto text-sm"
          />
        </div>

        {/* Rating */}
        <p className="text-sm font-bold mb-2">Hvor mange stjerner?</p>
        <div className="mb-5">
          <StarRating rating={rating} onRatingChange={setRating} size="lg" />
        </div>

        {/* Comment */}
        <label htmlFor="mark-read-comment" className="block text-sm font-bold mb-2">
          Kommentar <span className="font-normal" style={{ color: "var(--color-text-faint)" }}>(valgfritt)</span>
        </label>
        <textarea
          id="mark-read-comment"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={5000}
          placeholder="Hva syntes du? Kommentaren blir en anmeldelse andre i klubben kan se."
          className="input-field mb-2"
        />
        {content.trim() && (
          <label className="flex items-center gap-2 text-sm mb-2">
            <input type="checkbox" checked={spoilers} onChange={(e) => setSpoilers(e.target.checked)} className="w-4 h-4" />
            Inneholder spoilere
          </label>
        )}

        {error && (
          <p className="text-sm font-semibold mt-2" style={{ color: "var(--color-terracotta)" }} role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 mt-5">
          <button type="button" onClick={onClose} className="text-sm font-bold" style={{ color: "var(--color-text-faint)" }}>
            Hopp over
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
            {saving ? "Lagrer…" : "Lagre"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default MarkAsReadModal;
