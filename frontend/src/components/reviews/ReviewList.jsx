import { useState } from 'react';
import ReviewCard from './ReviewCard';

const ReviewList = ({ reviews, loading, onLike, onEdit, onDelete }) => {
  const [sortBy, setSortBy] = useState('newest');
  const [showSpoilers, setShowSpoilers] = useState(false);

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'highest-rated':
        return b.rating - a.rating || new Date(b.createdAt) - new Date(a.createdAt);
      case 'lowest-rated':
        return a.rating - b.rating || new Date(b.createdAt) - new Date(a.createdAt);
      case 'most-liked':
        return (b.likeCount || 0) - (a.likeCount || 0) || new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 mx-auto mb-4" style={{ border: '4px solid rgba(102, 126, 234, 0.3)', borderTopColor: '#667eea' }}></div>
        <p className="text-gray-600 font-medium">Laster anmeldelser...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(240, 147, 251, 0.1))' }}>
        <p className="text-3xl mb-3">📝</p>
        <p className="text-gray-700 font-bold text-lg">Ingen anmeldelser ennå</p>
        <p className="text-gray-600 mt-2">Bli den første til å dele dine tanker!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.7)' }}>
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-gray-700">
            🔄 Sorter etter:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field py-2 w-auto"
          >
            <option value="newest">Nyeste først</option>
            <option value="oldest">Eldste først</option>
            <option value="highest-rated">Høyest vurdert</option>
            <option value="lowest-rated">Lavest vurdert</option>
            <option value="most-liked">Mest likt</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="showSpoilers"
            checked={showSpoilers}
            onChange={(e) => setShowSpoilers(e.target.checked)}
            className="w-5 h-5 rounded cursor-pointer"
            style={{ accentColor: '#667eea' }}
          />
          <label htmlFor="showSpoilers" className="text-sm font-bold text-gray-700 cursor-pointer">
            Vis alle spoilere
          </label>
        </div>
      </div>

      {/* Review Count */}
      <p className="text-gray-600 font-medium">
        {reviews.length} {reviews.length === 1 ? 'anmeldelse' : 'anmeldelser'}
      </p>

      {/* Reviews */}
      <div className="space-y-6">
        {sortedReviews.map((review) => (
          <ReviewCard
            key={review._id}
            review={review}
            onLike={onLike}
            onEdit={onEdit}
            onDelete={onDelete}
            showSpoilers={showSpoilers}
          />
        ))}
      </div>
    </div>
  );
};

export default ReviewList;
