import { useState, useEffect } from 'react';
import { productsApi } from '../../api/productsApi';
import { booksApi } from '../../api/booksApi';

const ProductForm = ({ product = null, onSuccess, onCancel }) => {
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'USD',
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
        currency: product.currency || 'USD',
        category: product.category || 'other',
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
      console.error('Failed to fetch books:', err);
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
      setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} product`);
      console.error('Error saving product:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-gradient animate-fadeIn">
      <h2 className="text-3xl font-bold gradient-text mb-6">
        {isEditing ? '✏️ Edit Product' : '✨ Add New Product'}
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
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="input-field"
            placeholder="Enter product name"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="input-field"
            placeholder="Enter product description"
          />
        </div>

        {/* Price and Currency */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Price <span className="text-red-500">*</span>
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
              Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="input-field"
            >
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
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-field"
            >
              <option value="book">Book</option>
              <option value="merchandise">Merchandise</option>
              <option value="accessory">Accessory</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Stock Quantity
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
            📚 Related Book (Optional)
          </label>
          <select
            name="bookId"
            value={formData.bookId}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">None - Not related to a book</option>
            {books.map((book) => (
              <option key={book._id} value={book._id}>
                {book.title} by {book.author}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Link this product to a book if it's related (e.g., physical copy of a book in the library)
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
            ✅ Product is available for purchase
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isEditing ? '⏳ Updating...' : '⏳ Creating...') : (isEditing ? '✏️ Update Product' : '✨ Create Product')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg text-lg"
            style={{ background: 'linear-gradient(135deg, #9ca3af, #6b7280)', color: 'white' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
