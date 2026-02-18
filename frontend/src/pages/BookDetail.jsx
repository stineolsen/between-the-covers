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
        <Link to="/books" className="inline-flex items-center text-white hover:text-white/80 mb-6 font-bold text-lg transform transition-all hover:scale-105">
          <span className="mr-2">←</span> Tilbake til bøker
        </Link>

        <div className="grid md:grid-cols-3 gap-8 animate-fadeIn">
          {/* Book Cover */}
          <div className="md:col-span-1">
            <div className="container-gradient sticky top-8">
              <img
                src={coverUrl || placeholderImage}
                alt={book.title}
                className="w-full rounded-2xl shadow-2xl mb-4 transform transition-transform hover:scale-105"
              />

              {/* Bokklubb Month Badge (if applicable) */}
              {book.bookclubMonth && (
                <div
                  className="text-white text-center py-3 rounded-2xl font-bold mb-4 text-lg shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
                >
                  📅 {book.bookclubMonth}
                </div>
              )}

              {/* Library Links */}
              {(book.libraryLinks?.audiobook || book.libraryLinks?.ebook) && (
                <div className="space-y-3 mb-4">
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">📚 Bibiloteklenker</h3>
                  {book.libraryLinks.audiobook && (
                    <a
                      href={book.libraryLinks.audiobook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full btn-secondary text-center"
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
                    className="block w-full text-white text-center py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                  >
                    ✏️ Rediger bok
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full text-white py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
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
              {/* Title and Author */}
              <h1 className="text-5xl font-bold gradient-text mb-3">{book.title}</h1>
              <p className="text-2xl text-gray-600 font-semibold mb-6">av {book.author}</p>

              {/* Rating */}
              {book.averageRating > 0 && (
                <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1))' }}>
                  <div className="flex text-yellow-400 text-3xl">
                    {'★'.repeat(Math.round(book.averageRating))}
                    {'☆'.repeat(5 - Math.round(book.averageRating))}
                  </div>
                  <span className="text-xl text-gray-700 font-bold">
                    {book.averageRating.toFixed(1)} <span className="text-gray-500">({book.reviewCount} {book.reviewCount === 1 ? 'review' : 'reviews'})</span>
                  </span>
                </div>
              )}

              {/* User's Reading Status */}
              <div className="mb-6 p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))' }}>
                <StatusSelector
                  currentStatus={userBookStatus}
                  onStatusChange={handleStatusChange}
                  loading={statusLoading}
                />
              </div>

              {/* Description */}
              {book.description && (
                <div className="mb-6 p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.1), rgba(245, 87, 108, 0.1))' }}>
                  <h2 className="text-2xl font-bold gradient-text mb-3">📖 Beskrivelse</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">{book.description}</p>
                </div>
              )}

              {/* Book Details Grid */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6 p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))' }}>
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
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">🎨 Sjanger</h3>
                  <div className="flex flex-wrap gap-3">
                    {book.genres.map((genre, index) => (
                      <span
                        key={index}
                        className="text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg transition-all transform hover:scale-110"
                        style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              <div className="pt-6 mt-6">
                <h2 className="text-3xl font-bold gradient-text mb-6">💬 Anmeldelser</h2>

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
