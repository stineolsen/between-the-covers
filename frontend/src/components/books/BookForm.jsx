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
    language: 'Engelsk',
    series: '',
    seriesNumber: '',
    bookclubMonth: '',
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
        series: initialData.series || '',
        seriesNumber: initialData.seriesNumber || '',
        bookclubMonth: initialData.bookclubMonth || '',
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
        alert('Vennligst velg en bildefil');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Bildestørrelse må være mindre enn 5MB');
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
        series: formData.series || null,
        seriesNumber: formData.seriesNumber ? parseInt(formData.seriesNumber) : null,
        bookclubMonth: formData.bookclubMonth || null,
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
      setError(err.response?.data?.message || `Greide ikke ${isEditing ? 'oppdatere' : 'opprette'} bok`);
      console.error('Lagre bok feilmelding:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="container-gradient animate-fadeIn">
        <h2 className="text-4xl font-bold gradient-text mb-6">
          {isEditing ? '✏️ Rediger bok' : '✨ Legg til ny bok'}
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
              📸 Bokomslag bilde
            </label>
            <div className="flex items-start gap-4">
              {coverPreview && (
                <div className="w-32 h-48 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                  <img src={coverPreview} alt="Omslagsbilde forhåndvisning" className="w-full h-full object-cover" />
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
                  Anbefalt: 300x450px, maks 5MB (JPG, PNG, GIF, WebP)
                </p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Tittel <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                placeholder="Fyll inn boktittel"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Forfatter <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="author"
                required
                value={formData.author}
                onChange={handleChange}
                className="input-field"
                placeholder="Fyll inn forfatter"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beskrivelse
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              className="input-field"
              placeholder="Fyll inn beskrivelse"
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
                Utgivelsesår
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
                Antall sider
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
                Forlag
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
                Språk
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

          {/* Series Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                📚 Serie
              </label>
              <input
                type="text"
                name="series"
                value={formData.series}
                onChange={handleChange}
                className="input-field"
                placeholder="F.eks. Harry Potter"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                # Bok i serien
              </label>
              <input
                type="number"
                name="seriesNumber"
                value={formData.seriesNumber}
                onChange={handleChange}
                className="input-field"
                placeholder="1"
                min="0"
              />
            </div>
          </div>

          {/* Bokklubb Status */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📅 Bokklubb status (måned vi leser boken)
            </label>
            <select
              name="bookclubMonth"
              value={formData.bookclubMonth}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Ikke en bokklubb-bok</option>
              {(() => {
                const options = [];
                const months = ['Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
                               'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'];

                // Start from January 2025
                const startDate = new Date(2025, 0, 1); // January 2025

                // End 2 months from now
                const now = new Date();
                const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);

                // Generate all months from start to end
                const current = new Date(startDate);
                while (current <= endDate) {
                  const year = current.getFullYear();
                  const monthIndex = current.getMonth();
                  const monthName = months[monthIndex];
                  const value = `${monthName} ${year}`;

                  options.push(<option key={value} value={value}>{value}</option>);

                  // Move to next month
                  current.setMonth(current.getMonth() + 1);
                }

                return options.reverse(); // Most recent first
              })()}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Velg måned/år denne boken ble/vil bli lest av bokklubben, eller la være tom
            </p>
          </div>

          {/* Genres */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sjangere
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={genreInput}
                onChange={(e) => setGenreInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Legg til' && (e.preventDefault(), handleAddGenre())}
                className="input-field flex-1"
                placeholder="Legg til en sjanger og trykk på legg til"
              />
              <button
                type="button"
                onClick={handleAddGenre}
                className="btn-accent"
              >
                Legg til
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
                  Lenke til lydbok
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
                  Lenke til e-bok
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
                  Calibre nedlastingslenke
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
              {loading ? (isEditing ? '⏳ Oppdaterer...' : '⏳ Oppretter...') : (isEditing ? '✏️ Oppdater bok' : '✨ Opprett bok')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/books')}
              className="px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg text-lg"
              style={{ background: 'linear-gradient(135deg, #9ca3af, #6b7280)', color: 'white' }}
            >
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookForm;
