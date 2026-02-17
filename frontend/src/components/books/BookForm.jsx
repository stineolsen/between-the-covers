import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksApi } from '../../api/booksApi';

const BookForm = ({ bookId = null, initialData = null }) => {
  const navigate = useNavigate();
  const isEditing = !!bookId;

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    publishedYear: '',
    genres: [],
    pageCount: '',
    publisher: '',
    language: 'English',
    status: 'to-read',
    audiobookLink: '',
    ebookLink: '',
    calibreId: '',
    calibreDownloadLink: ''
  });

  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [genreInput, setGenreInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        author: initialData.author || '',
        isbn: initialData.isbn || '',
        description: initialData.description || '',
        publishedYear: initialData.publishedYear || '',
        genres: initialData.genres || [],
        pageCount: initialData.pageCount || '',
        publisher: initialData.publisher || '',
        language: initialData.language || 'English',
        status: initialData.status || 'to-read',
        audiobookLink: initialData.libraryLinks?.audiobook || '',
        ebookLink: initialData.libraryLinks?.ebook || '',
        calibreId: initialData.calibreId || '',
        calibreDownloadLink: initialData.calibreDownloadLink || ''
      });

      if (initialData.coverImage) {
        setCoverPreview(booksApi.getCoverUrl(initialData.coverImage));
      }
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      setCoverImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddGenre = () => {
    if (genreInput.trim() && !formData.genres.includes(genreInput.trim())) {
      setFormData(prev => ({
        ...prev,
        genres: [...prev.genres, genreInput.trim()]
      }));
      setGenreInput('');
    }
  };

  const handleRemoveGenre = (genreToRemove) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.filter(g => g !== genreToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const bookData = {
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn || undefined,
        description: formData.description,
        publishedYear: formData.publishedYear ? parseInt(formData.publishedYear) : undefined,
        genres: formData.genres,
        pageCount: formData.pageCount ? parseInt(formData.pageCount) : undefined,
        publisher: formData.publisher,
        language: formData.language,
        status: formData.status,
        libraryLinks: {
          audiobook: formData.audiobookLink || null,
          ebook: formData.ebookLink || null
        },
        calibreId: formData.calibreId || undefined,
        calibreDownloadLink: formData.calibreDownloadLink || undefined
      };

      // Add cover image if selected
      if (coverImage) {
        bookData.coverImage = coverImage;
      }

      let result;
      if (isEditing) {
        result = await booksApi.updateBook(bookId, bookData);
      } else {
        result = await booksApi.createBook(bookData);
      }

      // Navigate to the book detail page
      navigate(`/books/${result.book._id}`);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} book`);
      console.error('Error saving book:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="container-gradient animate-fadeIn">
        <h2 className="text-4xl font-bold gradient-text mb-6">
          {isEditing ? '✏️ Edit Book' : '✨ Add New Book'}
        </h2>

        {error && (
          <div className="mb-6 p-4 rounded-2xl text-white font-bold text-center animate-slideIn" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📸 Book Cover Image
            </label>
            <div className="flex items-start gap-4">
              {coverPreview && (
                <div className="w-32 h-48 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 300x450px, max 5MB (JPG, PNG, GIF, WebP)
                </p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter book title"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Author <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="author"
                required
                value={formData.author}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter author name"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              className="input-field"
              placeholder="Enter book description"
            />
          </div>

          {/* Book Details */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                ISBN
              </label>
              <input
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                className="input-field"
                placeholder="978-0-123456-78-9"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Published Year
              </label>
              <input
                type="number"
                name="publishedYear"
                value={formData.publishedYear}
                onChange={handleChange}
                className="input-field"
                placeholder="2023"
                min="0"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Page Count
              </label>
              <input
                type="number"
                name="pageCount"
                value={formData.pageCount}
                onChange={handleChange}
                className="input-field"
                placeholder="350"
                min="0"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Publisher
              </label>
              <input
                type="text"
                name="publisher"
                value={formData.publisher}
                onChange={handleChange}
                className="input-field"
                placeholder="Publisher name"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Language
              </label>
              <input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="input-field"
                placeholder="English"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reading Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input-field"
            >
              <option value="to-read">To Read</option>
              <option value="currently-reading">Currently Reading</option>
              <option value="read">Read</option>
            </select>
          </div>

          {/* Genres */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Genres
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={genreInput}
                onChange={(e) => setGenreInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGenre())}
                className="input-field flex-1"
                placeholder="Add a genre and press Enter"
              />
              <button
                type="button"
                onClick={handleAddGenre}
                className="btn-accent"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.genres.map((genre, index) => (
                <span
                  key={index}
                  className="text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg transition-all transform hover:scale-110"
                  style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}
                >
                  {genre}
                  <button
                    type="button"
                    onClick={() => handleRemoveGenre(genre)}
                    className="text-white hover:text-red-200 font-bold text-lg"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Library Links */}
          <div className="p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))' }}>
            <h3 className="text-2xl font-bold gradient-text mb-4">📚 Library Links</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Audiobook Link
                </label>
                <input
                  type="url"
                  name="audiobookLink"
                  value={formData.audiobookLink}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  E-book Link
                </label>
                <input
                  type="url"
                  name="ebookLink"
                  value={formData.ebookLink}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Calibre-web Integration (Optional) */}
          <div className="p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.1), rgba(245, 87, 108, 0.1))' }}>
            <h3 className="text-2xl font-bold gradient-text mb-4">📥 Calibre-web Integration (Optional)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Calibre ID
                </label>
                <input
                  type="text"
                  name="calibreId"
                  value={formData.calibreId}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Book ID in Calibre"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Calibre Download Link
                </label>
                <input
                  type="url"
                  name="calibreDownloadLink"
                  value={formData.calibreDownloadLink}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isEditing ? '⏳ Updating...' : '⏳ Creating...') : (isEditing ? '✏️ Update Book' : '✨ Create Book')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/books')}
              className="px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg text-lg"
              style={{ background: 'linear-gradient(135deg, #9ca3af, #6b7280)', color: 'white' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookForm;
