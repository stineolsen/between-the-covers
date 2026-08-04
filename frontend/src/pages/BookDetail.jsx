import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { booksApi } from "../api/booksApi";
import { reviewsApi } from "../api/reviewsApi";
import { userBooksApi } from "../api/userBooksApi";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import ReviewList from "../components/reviews/ReviewList";
import ReviewForm from "../components/reviews/ReviewForm";
import StatusSelector from "../components/books/StatusSelector";
import RecommendModal from "../components/books/RecommendModal";
import AddToListMenu from "../components/books/AddToListMenu";
import UserAvatar from "../components/common/UserAvatar";
import { normalizeAuthor } from "../utils/normalizeAuthor";

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const toast = useToast();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [showRecommendModal, setShowRecommendModal] = useState(false);

  // User book status states
  const [userBookStatus, setUserBookStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Readers state
  const [readers, setReaders] = useState([]);
  const [tbrList, setTbrList] = useState([]);
  const [owners, setOwners] = useState([]);
  const [userOwned, setUserOwned] = useState(false);
  const [ownedLoading, setOwnedLoading] = useState(false);

  useEffect(() => {
    fetchBook();
    fetchReviews();
    fetchUserReview();
    fetchUserBookStatus();
    fetchReaders();
    fetchTBR();
    fetchOwners();
  }, [id]);

  const fetchReaders = async () => {
    try {
      const data = await userBooksApi.getBookReaders(id);
      setReaders(data.readers || []);
    } catch {
      setReaders([]);
    }
  };

  const fetchTBR = async () => {
    try {
      const data = await userBooksApi.getBookTBR(id);
      setTbrList(data.tbr || []);
    } catch {
      setTbrList([]);
    }
  };

  const fetchBook = async () => {
    try {
      setLoading(true);
      const data = await booksApi.getBook(id);
      setBook(data.book);
    } catch (err) {
      setError(err.response?.data?.message || "Greide ikke laste bok");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Er du sikker på at du vil slette "${book.title}"? Dette er permanent.`,
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      await booksApi.deleteBook(id);
      navigate("/books");
    } catch (err) {
      alert(err.response?.data?.message || "Greide ikke slette bok");
      setDeleting(false);
    }
  };

  // Fetch reviews for this book
  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const data = await reviewsApi.getReviews({ bookId: id });
      setReviews(data.reviews || []);
    } catch (err) {
      console.error("Greide ikke hente anmeldelser:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fetch user's review for this book
  const fetchUserReview = async () => {
    try {
      const data = await reviewsApi.getUserReviewForBook(id);
      if (data.review) {
        setUserReview(data.review);
      }
    } catch (err) {
      // No review found, that's ok
      setUserReview(null);
    }
  };

  // Submit review (create or update)
  const handleReviewSubmit = async (reviewData) => {
    try {
      if (editingReview) {
        // Update existing review
        await reviewsApi.updateReview(editingReview._id, reviewData);
      } else {
        // Create new review
        await reviewsApi.createReview(reviewData);
      }

      // Refresh data
      await Promise.all([fetchBook(), fetchReviews(), fetchUserReview()]);

      // Close form
      setShowReviewForm(false);
      setEditingReview(null);
    } catch (err) {
      throw new Error(
        err.response?.data?.message || "Greide ikke lagre anmeldelse",
      );
    }
  };

  // Toggle like on review
  const handleToggleLike = async (reviewId) => {
    try {
      await reviewsApi.toggleLike(reviewId);
      // Refresh reviews
      await fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || "Greide ikke endre like status");
    }
  };

  // Edit review
  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  // Delete review
  const handleDeleteReview = async (reviewId) => {
    if (
      !window.confirm("Er du sikker på at du vil slette denne anmeldelsen?")
    ) {
      return;
    }

    try {
      await reviewsApi.deleteReview(reviewId);
      // Refresh data
      await Promise.all([fetchBook(), fetchReviews(), fetchUserReview()]);
    } catch (err) {
      alert(err.response?.data?.message || "Greide ikke slette anmeldelse");
    }
  };

  // Fetch user's reading status for this book
  const fetchUserBookStatus = async () => {
    try {
      const data = await userBooksApi.getUserBookStatus(id);
      if (data.userBook) {
        setUserBookStatus(data.userBook.status);
        setUserOwned(data.userBook.owned || false);
      } else {
        setUserBookStatus(null);
        setUserOwned(false);
      }
    } catch (err) {
      setUserBookStatus(null);
      setUserOwned(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const data = await userBooksApi.getBookOwners(id);
      setOwners(data.owners || []);
    } catch {
      setOwners([]);
    }
  };

  const handleToggleOwned = async () => {
    setOwnedLoading(true);
    try {
      const data = await userBooksApi.toggleOwned(id);
      setUserOwned(data.owned);
      setOwners(await userBooksApi.getBookOwners(id).then(d => d.owners || []));
    } catch {
      toast.error("Greide ikke oppdatere bokhylle");
    } finally {
      setOwnedLoading(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (status) => {
    try {
      console.log("Oppdater status til:", status, "for bok:", id);
      setStatusLoading(true);
      const result = await userBooksApi.setBookStatus(id, status);
      console.log("Status oppdatert resultat:", result);
      setUserBookStatus(status);

      // Show success message
      toast.success("Lese status oppdatert!");
    } catch (err) {
      console.error("Status oppdatering error:", err);
      console.error("Error response:", err.response);
      console.error("Error data:", err.response?.data);
      toast.error(
        err.response?.data?.message ||
          "Greide ikke oppdatere status. Venligst sjekk logg for detaljer.",
      );
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div
            className="animate-spin rounded-full h-20 w-20 mx-auto mb-4"
            style={{
              border: "4px solid rgba(255,255,255,0.3)",
              borderTopColor: "white",
            }}
          ></div>
          <p className="text-white text-xl font-bold drop-shadow-lg">
            ✨ Laster bokdetaljer...
          </p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div
            className="container-gradient text-center py-12 animate-fadeIn"
            style={{ background: "linear-gradient(135deg, #f093fb, #f5576c)" }}
          >
            <p className="text-white text-2xl font-bold mb-6">
              😢 {error || "Noe er feil, finner ikke boken"}
            </p>
            <Link to="/books" className="btn-accent">
              ← Tilbake til bøker
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const coverUrl = book.coverImage
    ? booksApi.getCoverUrl(book.coverImage)
    : null;
  const placeholderImage =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"%3E%3Crect fill="%23e5e7eb" width="300" height="450"/%3E%3Ctext x="50%25" y="50%25" font-size="24" text-anchor="middle" alignment-baseline="middle" font-family="monospace, sans-serif" fill="%239ca3af"%3ENo Cover%3C/text%3E%3C/svg%3E';

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <Link
          to="/books"
          className="inline-flex items-center text-gray-600 hover:text-purple-700 mb-3 font-semibold transition-colors"
        >
          <span className="mr-2 md:btn-primary">←</span> Tilbake til bøker
        </Link>

        {/* Light purple header card — cover + title/author/rating */}
        <div
          className="rounded-2xl p-2 sm:p-4 mb-6 animate-fadeIn flex flex-col grid grid-cols-3 md:flex-row gap-6 items-start"
          style={{
            background: "rgba(107, 91, 149, 0.08)",
            border: "1px solid rgba(107, 91, 149, 0.15)",
          }}
        >
          {/* Cover */}
          <div className="col-span-1 w-30 sm:w-36 flex-shrink-0 p-1">
            <img
              src={coverUrl || placeholderImage}
              alt={book.title}
              className="w-full rounded-xl shadow-lg"
            />
          </div>
          {/* Title / Author / Rating / Status */}
          <div className="col-span-2 flex-1 px-3">
            {book.bookclubMonth && (
              <span
                className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
                style={{ border: "1.5px solid #6B5B95", color: "#6B5B95" }}
              >
                📅 {book.bookclubMonth}
              </span>
            )}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
              {book.title}
            </h1>
            <p className="text-md md:text-lg text-gray-500 mb-4">
              av{" "}
              <Link
                to={`/authors/${encodeURIComponent(normalizeAuthor(book.author))}`}
                className="hover:text-purple-700 hover:underline transition-colors"
              >
                {book.author}
              </Link>
            </p>

            {book.averageRating > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-yellow-400 text-xl tracking-tight">
                  {"★".repeat(Math.round(book.averageRating))}
                  <span className="text-gray-300">
                    {"★".repeat(5 - Math.round(book.averageRating))}
                  </span>
                </span>
                <span className="text-gray-500 text-sm">
                  {book.averageRating.toFixed(1)} ({book.reviewCount}{" "}
                  {book.reviewCount === 1 ? "anmeldelse" : "anmeldelser"})
                </span>
              </div>
            )}

            {/* User reading status */}
            <div className="mb-1">
              <StatusSelector
                currentStatus={userBookStatus}
                onStatusChange={handleStatusChange}
                loading={statusLoading}
              />
            </div>

            {/* Own this book toggle */}
            <div className="mt-3">
              <button
                onClick={handleToggleOwned}
                disabled={ownedLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all disabled:opacity-50"
                style={userOwned
                  ? { background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white" }
                  : { background: "rgba(245,158,11,0.1)", color: "#d97706", border: "1.5px solid #f59e0b" }
                }
              >
                {ownedLoading ? "⏳" : userOwned ? "📖 Jeg eier denne boken" : "📖 Legg til bokhyllen"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 animate-fadeIn">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="container-gradient sticky top-8">
              {/* Library Links */}
              {(book.libraryLinks?.audiobook || book.libraryLinks?.ebook) && (
                <div className="space-y-3 mb-4">
                  <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">
                    Biblioteklenker
                  </h3>
                  <div className="grid grid-cols-2 gap-3 ">
                    {book.libraryLinks.audiobook && (
                      <a
                        href={book.libraryLinks.audiobook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="md:w-full btn-primary text-center"
                      >
                        🎧 Lytt
                      </a>
                    )}
                    {book.libraryLinks.ebook && (
                      <a
                        href={book.libraryLinks.ebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="md:w-full btn-primary text-center"
                      >
                        📱 Les
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              {isAdmin && (
                <div className="mt-4 space-y-3">
                  <Link
                    to={`/books/${book._id}/edit`}
                    className="block w-full btn-primary text-center"
                  >
                    ✏️ Rediger bok
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full btn-secondary disabled:opacity-50"
                  >
                    {deleting ? "Sletter..." : "🗑️ Slett bok"}
                  </button>
                </div>
              )}

              {/* Add to list */}
              <div className="mt-4">
                <AddToListMenu book={book} />
              </div>

              {/* Recommend button */}
              <div className="mt-4">
                <button
                  onClick={() => setShowRecommendModal(v => !v)}
                  className="w-full py-2 rounded-xl text-white font-semibold text-sm transition-all"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
                >
                  📤 Anbefal denne boken
                </button>
                {showRecommendModal && (
                  <RecommendModal
                    book={book}
                    onClose={() => setShowRecommendModal(false)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="md:col-span-2">
            <div className="container-gradient">
              {/* Description */}
              {book.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-700 mb-2 uppercase tracking-wide text-sm">
                    Beskrivelse
                  </h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {descExpanded || book.description.length <= 300
                      ? book.description
                      : book.description.slice(0, 300).trimEnd() + "…"}
                  </p>
                  {book.description.length > 300 && (
                    <button
                      onClick={() => setDescExpanded((v) => !v)}
                      className="mt-2 text-sm font-semibold"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {descExpanded ? "Vis mindre" : "Les mer"}
                    </button>
                  )}
                </div>
              )}

              {/* Book Details Grid */}
              <div className="grid grid-cols-2 gap-1 mb-6 p-2 rounded-xl bg-gray-50">
                {book.series && (
                  <div className="p-3 bg-white rounded-xl">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">
                      📚 Serie
                    </h3>
                    <p className="text-gray-700 font-medium">
                      <Link
                        to={`/series/${encodeURIComponent(book.series)}`}
                        className="hover:text-purple-700 hover:underline transition-colors"
                      >
                        {book.series}
                      </Link>
                      {book.seriesNumber ? ` #${book.seriesNumber}` : ""}
                    </p>
                  </div>
                )}
                {book.isbn && (
                  <div className="hidden sm:p-3 bg-white rounded-xl">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">
                      📖 ISBN
                    </h3>
                    <p className="text-gray-700 font-medium">{book.isbn}</p>
                  </div>
                )}
                {book.publishedYear && (
                  <div className="p-3 bg-white rounded-xl">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">
                      📅 Publisert
                    </h3>
                    <p className="text-gray-700 font-medium">
                      {book.publishedYear}
                    </p>
                  </div>
                )}
                {book.pageCount && (
                  <div className="p-3 bg-white rounded-xl">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">
                      📄 Sider
                    </h3>
                    <p className="text-gray-700 font-medium">
                      {book.pageCount}
                    </p>
                  </div>
                )}
                {book.publisher && (
                  <div className="hidden sm:p-3 bg-white rounded-xl">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">
                      🏢 Utgiver
                    </h3>
                    <p className="text-gray-700 font-medium">
                      {book.publisher}
                    </p>
                  </div>
                )}
                {book.language && (
                  <div className="p-3 bg-white rounded-xl">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">
                      🌐 Språk
                    </h3>
                    <p className="text-gray-700 font-medium">{book.language}</p>
                  </div>
                )}
                {book.dateAdded && (
                  <div className="hidden sm:p-3 bg-white rounded-xl">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">
                      ➕ Lagt til samling
                    </h3>
                    <p className="text-gray-700 font-medium">
                      {new Date(book.dateAdded).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {book.bookclubMonth && (
                  <div className="p-3 bg-white rounded-xl">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">
                      📅 Bokklubb bok
                    </h3>
                    <p className="text-gray-700 font-medium">
                      {book.bookclubMonth}
                    </p>
                  </div>
                )}
              </div>

              {/* Genres */}
              {book.genres && book.genres.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                    Sjangere
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {book.genres.map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-0.75 rounded-full text-sm font-semibold"
                        style={{
                          border: "1.5px solid #6B5B95",
                          color: "#6B5B95",
                        }}
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Read by section */}
              {readers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                    ✅ Lest av ({readers.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {readers.map(({ user: u, finishedAt }) => (
                      <Link
                        key={u._id}
                        to={`/members/${u._id}`}
                        title={finishedAt ? new Date(finishedAt).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" }) : undefined}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-sm border border-gray-100 text-sm font-medium text-gray-700 hover:opacity-80 transition-opacity"
                      >
                        <UserAvatar user={u} className="w-5 h-5 rounded-full text-xs font-bold" />
                        {u.displayName || u.username}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Owned by section */}
              {owners.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                    📖 Eies av ({owners.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {owners.map(({ user: u }) => (
                      <Link
                        key={u._id}
                        to={`/members/${u._id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-sm border border-gray-100 text-sm font-medium text-gray-700 hover:opacity-80 transition-opacity"
                      >
                        <UserAvatar user={u} className="w-5 h-5 rounded-full text-xs font-bold" />
                        {u.displayName || u.username}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* TBR section */}
              {tbrList.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                    📚 Ønsker å lese ({tbrList.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tbrList.map(({ user: u }) => (
                      <Link
                        key={u._id}
                        to={`/members/${u._id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-sm border border-gray-100 text-sm font-medium text-gray-700 hover:opacity-80 transition-opacity"
                      >
                        <UserAvatar user={u} className="w-5 h-5 rounded-full text-xs font-bold" />
                        {u.displayName || u.username}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              <div className="pt-6 mt-6 border-t border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  Anmeldelser
                </h2>

                {/* Write/Edit Review Button */}
                {!showReviewForm && (
                  <div className="mb-6">
                    {userReview ? (
                      <button
                        onClick={() => handleEditReview(userReview)}
                        className="btn-secondary"
                      >
                        ✏️ Rediger din anmeldelse
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingReview(null);
                          setShowReviewForm(true);
                        }}
                        className="btn-primary"
                      >
                        ✨ Skriv en anmeldelse
                      </button>
                    )}
                  </div>
                )}

                {/* Review Form */}
                {showReviewForm && (
                  <div className="mb-6">
                    <ReviewForm
                      bookId={id}
                      initialData={editingReview}
                      onSubmit={handleReviewSubmit}
                      onCancel={() => {
                        setShowReviewForm(false);
                        setEditingReview(null);
                      }}
                    />
                  </div>
                )}

                {/* Reviews List */}
                <ReviewList
                  reviews={reviews}
                  loading={reviewsLoading}
                  onLike={handleToggleLike}
                  onEdit={handleEditReview}
                  onDelete={handleDeleteReview}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
