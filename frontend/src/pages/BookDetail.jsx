import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { booksApi } from '../api/booksApi';
import { reviewsApi } from '../api/reviewsApi';
import { userBooksApi } from '../api/userBooksApi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ReviewList from '../components/reviews/ReviewList';
import ReviewForm from '../components/reviews/ReviewForm';
import StatusSelector from '../components/books/StatusSelector';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const toast = useToast();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  // User book status states
  const [userBookStatus, setUserBookStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    fetchBook();
    fetchReviews();
    fetchUserReview();
    fetchUserBookStatus();
  }, [id]);

  const fetchBook = async () => {
    try {
      setLoading(true);
      const data = await booksApi.getBook(id);
      setBook(data.book);
    } catch (err) {
      setError(err.response?.data?.message || 'Greide ikke laste bok');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Er du sikker på at du vil slette "${book.title}"? Dette er permanent.`)) {
      return;
    }

    try {
      setDeleting(true);
      await booksApi.deleteBook(id);
      navigate('/books');
    } catch (err) {
      alert(err.response?.data?.message || 'Greide ikke slette bok');
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
      console.error('Greide ikke hente anmeldelser:', err);
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
      throw new Error(err.response?.data?.message || 'Greide ikke lagre anmeldelse');
    }
  };

  // Toggle like on review
  const handleToggleLike = async (reviewId) => {
    try {
      await reviewsApi.toggleLike(reviewId);
      // Refresh reviews
      await fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Greide ikke endre like status');
    }
  };

  // Edit review
  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  // Delete review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Er du sikker på at du vil slette denne anmeldelsen?')) {
      return;
    }

    try {
      await reviewsApi.deleteReview(reviewId);
      // Refresh data
      await Promise.all([fetchBook(), fetchReviews(), fetchUserReview()]);
    } catch (err) {
      alert(err.response?.data?.message || 'Greide ikke slette anmeldelse');
    }
  };

  // Fetch user's reading status for this book
  const fetchUserBookStatus = async () => {
    try {
      const data = await userBooksApi.getUserBookStatus(id);
      if (data.userBook) {
        setUserBookStatus(data.userBook.status);
      } else {
        setUserBookStatus(null);
      }
    } catch (err) {
      // No status found, that's ok
      setUserBookStatus(null);
    }
  };

  // Handle status change
  const handleStatusChange = async (status) => {
    try {
      console.log('Oppdater status til:', status, 'for bok:', id);
      setStatusLoading(true);
      const result = await userBooksApi.setBookStatus(id, status);
      console.log('Status oppdatert resultat:', result);
      setUserBookStatus(status);

      // Show success message
      toast.success('Lese status oppdatert!');
    } catch (err) {
      console.error('Status oppdatering error:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      toast.error(err.response?.data?.message || 'Greide ikke oppdatere status. Venligst sjekk logg for detaljer.');
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="animate-spin rounded-full h-20 w-20 mx-auto mb-4" style={{ border: '4px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}></div>
          <p className="text-white text-xl font-bold drop-shadow-lg">✨ Laster bokdetaljer...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="container-gradient text-center py-12 animate-fadeIn" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
            <p className="text-white text-2xl font-bold mb-6">😢 {error || 'Book not found'}</p>
            <Link to="/books" className="btn-accent">
              ← Tilbake til bøker
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const coverUrl = book.coverImage ? booksApi.getCoverUrl(book.coverImage) : null;
  const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"%3E%3Crect fill="%23e5e7eb" width="300" height="450"/%3E%3Ctext x="50%25" y="50%25" font-size="24" text-anchor="middle" alignment-baseline="middle" font-family="monospace, sans-serif" fill="%239ca3af"%3ENo Cover%3C/text%3E%3C/svg%3E';

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <Link to="/books" className="inline-flex items-center text-gray-600 hover:text-purple-700 mb-6 font-semibold transition-colors">
          <span className="mr-2 btn-primary">←</span> Tilbake til bøker
        </Link>

        {/* Light purple header card — cover + title/author/rating */}
        <div className="rounded-2xl p-6 mb-6 animate-fadeIn flex flex-col md:flex-row gap-6 items-start"
          style={{ background: 'rgba(107, 91, 149, 0.08)', border: '1px solid rgba(107, 91, 149, 0.15)' }}>
          {/* Cover */}
          <div className="w-36 flex-shrink-0">
            <img
              src={coverUrl || placeholderImage}
              alt={book.title}
              className="w-full rounded-xl shadow-lg"
            />
          </div>
          {/* Title / Author / Rating / Status */}
          <div className="flex-1 min-w-0">
            {book.bookclubMonth && (
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
                style={{ border: '1.5px solid #6B5B95', color: '#6B5B95' }}>
                📅 {book.bookclubMonth}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">{book.title}</h1>
            <p className="text-lg text-gray-500 mb-4">av {book.author}</p>

            {book.averageRating > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-yellow-400 text-xl tracking-tight">
                  {'★'.repeat(Math.round(book.averageRating))}
                  <span className="text-gray-300">{'★'.repeat(5 - Math.round(book.averageRating))}</span>
                </span>
                <span className="text-gray-500 text-sm">{book.averageRating.toFixed(1)} ({book.reviewCount} {book.reviewCount === 1 ? 'anmeldelse' : 'anmeldelser'})</span>
              </div>
            )}

            {/* User reading status */}
            <div className="mb-2">
              <StatusSelector
                currentStatus={userBookStatus}
                onStatusChange={handleStatusChange}
                loading={statusLoading}
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 animate-fadeIn">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="container-gradient sticky top-8">

              {/* Library Links */}
              {(book.libraryLinks?.audiobook || book.libraryLinks?.ebook) && (
                <div className="space-y-3 mb-4">
                  <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Biblioteklenker</h3>
                  {book.libraryLinks.audiobook && (
                    <a
                      href={book.libraryLinks.audiobook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full btn-primary text-center"
                    >
                      🎧 Lydbok
                    </a>
                  )}
                  {book.libraryLinks.ebook && (
                    <a
                      href={book.libraryLinks.ebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full btn-primary text-center"
                    >
                      📱 E-bok
                    </a>
                  )}
                </div>
              )}

              {/* Calibre Download Link (if available) */}
              {book.calibreDownloadLink && (
                <a
                  href={book.calibreDownloadLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full btn-accent text-center mb-4"
                >
                  📥 Last ned fra Calibre
                </a>
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
                    {deleting ? 'Sletter...' : '🗑️ Slett bok'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Book Details */}
          <div className="md:col-span-2">
            <div className="container-gradient">

              {/* Description */}
              {book.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-700 mb-2 uppercase tracking-wide text-sm">Beskrivelse</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {descExpanded || book.description.length <= 300
                      ? book.description
                      : book.description.slice(0, 300).trimEnd() + '…'}
                  </p>
                  {book.description.length > 300 && (
                    <button
                      onClick={() => setDescExpanded(v => !v)}
                      className="mt-2 text-sm font-semibold"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {descExpanded ? 'Vis mindre' : 'Les mer'}
                    </button>
                  )}
                </div>
              )}

              {/* Book Details Grid */}
              <div className="grid sm:grid-cols-2 gap-3 mb-6 p-4 rounded-xl bg-gray-50">
                {book.series && (
                  <div className="p-3 bg-white rounded-xl">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">📚 Serie</h3>
                    <p className="text-gray-700 font-medium">
                      {book.series}{book.seriesNumber ? ` #${book.seriesNumber}` : ''}
                    </p>
                  </div>
                )}
                {book.isbn && (
                  <div className="p-3 bg-white rounded-xl">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">📖 ISBN</h3>
                    <p className="text-gray-700 font-medium">{book.isbn}</p>
                  </div>
                )}
                {book.publishedYear && (
                  <div className="p-3 bg-white rounded-xl">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">📅 Publisert</h3>
                    <p className="text-gray-700 font-medium">{book.publishedYear}</p>
                  </div>
                )}
                {book.pageCount && (
                  <div className="p-3 bg-white rounded-xl">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">📄 Sider</h3>
                    <p className="text-gray-700 font-medium">{book.pageCount}</p>
                  </div>
                )}
                {book.publisher && (
                  <div className="p-3 bg-white rounded-xl">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">🏢 Utgiver</h3>
                    <p className="text-gray-700 font-medium">{book.publisher}</p>
                  </div>
                )}
                {book.language && (
                  <div className="p-3 bg-white rounded-xl">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">🌐 Språk</h3>
                    <p className="text-gray-700 font-medium">{book.language}</p>
                  </div>
                )}
                {book.dateAdded && (
                  <div className="p-3 bg-white rounded-xl">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">➕ Lagt til samling</h3>
                    <p className="text-gray-700 font-medium">{new Date(book.dateAdded).toLocaleDateString()}</p>
                  </div>
                )}
                {book.bookclubMonth && (
                  <div className="p-3 bg-white rounded-xl">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">📅 Bokklubb bok</h3>
                    <p className="text-gray-700 font-medium">{book.bookclubMonth}</p>
                  </div>
                )}
              </div>

              {/* Genres */}
              {book.genres && book.genres.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Sjangere</h3>
                  <div className="flex flex-wrap gap-2">
                    {book.genres.map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-0.75 rounded-full text-sm font-semibold"
                        style={{ border: '1.5px solid #6B5B95', color: '#6B5B95' }}
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              <div className="pt-6 mt-6 border-t border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Anmeldelser</h2>

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
