import { useState, useEffect } from 'react';
import { productsApi } from '../../api/productsApi';
import { booksApi } from '../../api/booksApi';

const ProductForm = ({ product = null, onSuccess, onCancel }) => {
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'NOK',
    category: 'other',
    stock: '',
    isAvailable: true,
    bookId: ''
  });

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBooks();

    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        currency: product.currency || 'NOK',
        category: product.category || 'annet',
        stock: product.stock || '',
        isAvailable: product.isAvailable !== undefined ? product.isAvailable : true,
        bookId: product.book?._id || ''
      });
    }
  }, [product]);

  const fetchBooks = async () => {
    try {
      const data = await booksApi.getBooks();
      setBooks(data.books || []);
    } catch (err) {
      console.error('Greide ikke hente bøker:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: formData.currency,
        category: formData.category,
        stock: parseInt(formData.stock) || 0,
        isAvailable: formData.isAvailable,
        bookId: formData.bookId || null
      };

      if (isEditing) {
        await productsApi.updateProduct(product._id, productData);
      } else {
        await productsApi.createProduct(productData);
      }

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || `Greide ikke ${isEditing ? 'oppdatere' : 'opprette'} vare`);
      console.error('Greide ikke lagre vare:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-gradient animate-fadeIn">
      <h2 className="text-3xl font-bold gradient-text mb-6">
        {isEditing ? '✏️ Rediger vare' : '✨ Legg til ny vare'}
      </h2>

      {error && (
        <div className="mb-6 p-4 rounded-2xl text-white font-bold text-center animate-slideIn" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Varenavn <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="input-field"
            placeholder="Skriv inn varenavn"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Beskrivelse
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="input-field"
            placeholder="Skriv inn varebeskrivelse"
          />
        </div>

        {/* Price and Currency */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Pris <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              required
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              className="input-field"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Valutta
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="input-field"
            >
              <option value="NOK">NOK (kr)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>

        {/* Category and Stock */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Kategori
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-field"
            >
              <option value="book">Bokrelatert</option>
              <option value="merchandise">Merch</option>
              <option value="accessory">Tilbehør</option>
              <option value="other">Annet</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Antall på lager
            </label>
            <input
              type="number"
              name="stock"
              min="0"
              value={formData.stock}
              onChange={handleChange}
              className="input-field"
              placeholder="0"
            />
          </div>
        </div>

        {/* Related Book (Optional) */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            📚 Relatert til bok (valgritt)
          </label>
          <select
            name="bookId"
            value={formData.bookId}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Ikke relatert til noe bok</option>
            {books.map((book) => (
              <option key={book._id} value={book._id}>
                {book.title} by {book.author}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Link varer til en bok dersom de henger sammen (e.g., merch til en bok i bibiloteket)
          </p>
        </div>

        {/* Availability */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50">
          <input
            type="checkbox"
            id="isAvailable"
            name="isAvailable"
            checked={formData.isAvailable}
            onChange={handleChange}
            className="w-5 h-5 rounded cursor-pointer"
          />
          <label htmlFor="isAvailable" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
            ✅ Vare er tilgjengelig for kjøp
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isEditing ? '⏳ Oppdatere...' : '⏳ Oppretter...') : (isEditing ? '✏️ Oppdater vare' : '✨ Opprett vare')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg text-lg"
            style={{ background: 'linear-gradient(135deg, #9ca3af, #6b7280)', color: 'white' }}
          >
            Avbryt
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
