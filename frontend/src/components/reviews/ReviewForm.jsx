import { useState, useEffect } from 'react';
import StarRating from './StarRating';

const ReviewForm = ({ bookId, initialData = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    rating: initialData?.rating || 0,
    title: initialData?.title || '',
    content: initialData?.content || '',
    readingDate: initialData?.readingDate ? new Date(initialData.readingDate).toISOString().split('T')[0] : '',
    spoilers: initialData?.spoilers || false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (formData.content.trim().length < 10) {
      setError('Review must be at least 10 characters');
      return;
    }

    setLoading(true);

    try {
      await onSubmit({ ...formData, bookId });
    } catch (err) {
      setError(err.message || 'Failed to save review');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl text-white font-bold text-center animate-slideIn" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
          {error}
        </div>
      )}

      {/* Rating */}
      <div className="p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.15))' }}>
        <label className="block text-lg font-bold text-gray-900 mb-3">
          ⭐ Your Rating
        </label>
        <StarRating
          rating={formData.rating}
          onRatingChange={handleRatingChange}
          size="lg"
        />
      </div>

      {/* Review Title */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          📝 Review Title (Optional)
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          maxLength={100}
          className="input-field"
          placeholder="Sum up your thoughts in a few words..."
        />
      </div>

      {/* Review Content */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          💭 Your Review <span className="text-red-500">*</span>
        </label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          className="input-field resize-vertical"
          placeholder="Share your thoughts about this book... What did you love? What could have been better?"
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.content.length}/5000 characters (min 10)
        </p>
      </div>

      {/* Reading Date */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          📅 Reading Date (Optional)
        </label>
        <input
          type="date"
          name="readingDate"
          value={formData.readingDate}
          onChange={handleChange}
          max={new Date().toISOString().split('T')[0]}
          className="input-field"
        />
      </div>

      {/* Spoiler Warning */}
      <div className="flex items-center p-4 rounded-2xl" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
        <input
          type="checkbox"
          id="spoilers"
          name="spoilers"
          checked={formData.spoilers}
          onChange={handleChange}
          className="w-5 h-5 rounded cursor-pointer"
          style={{ accentColor: '#f5576c' }}
        />
        <label htmlFor="spoilers" className="ml-3 text-sm font-bold text-gray-700 cursor-pointer">
          ⚠️ This review contains spoilers
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Saving...' : (initialData ? '✏️ Update Review' : '✨ Post Review')}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg text-lg"
            style={{ background: 'linear-gradient(135deg, #9ca3af, #6b7280)', color: 'white' }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;
