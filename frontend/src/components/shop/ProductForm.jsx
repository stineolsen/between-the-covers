import { useState, useEffect, useRef } from "react";
import { productsApi } from "../../api/productsApi";
import { booksApi } from "../../api/booksApi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ProductForm = ({ product = null, onSuccess, onCancel }) => {
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    currency: "NOK",
    category: "other",
    stock: "",
    isAvailable: true,
    bookId: "",
  });

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [sizeInput, setSizeInput] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchBooks();

    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        currency: product.currency || "NOK",
        category: product.category || "annet",
        stock: product.stock || "",
        isAvailable:
          product.isAvailable !== undefined ? product.isAvailable : true,
        bookId: product.book?._id || "",
      });
      if (product.images && product.images[0]) {
        setImagePreview(`${API_URL}/uploads/products/${product.images[0]}`);
      }
      setSizes(product.sizes || []);
    }
  }, [product]);

  const addSize = () => {
    const trimmed = sizeInput.trim().toUpperCase();
    if (trimmed && !sizes.includes(trimmed)) {
      setSizes(prev => [...prev, trimmed]);
    }
    setSizeInput('');
  };

  const removeSize = (size) => setSizes(prev => prev.filter(s => s !== size));

  const handleSizeKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addSize(); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const fetchBooks = async () => {
    try {
      const data = await booksApi.getBooks();
      const sorted = (data.books || []).sort((a, b) =>
        a.title.localeCompare(b.title, "nb"),
      );
      setBooks(sorted);
    } catch (err) {
      console.error("Greide ikke hente bøker:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: formData.currency,
        category: formData.category,
        stock: parseInt(formData.stock) || 0,
        isAvailable: formData.isAvailable,
        bookId: formData.bookId || null,
        sizes,
      };

      if (isEditing) {
        await productsApi.updateProduct(product._id, productData, imageFile);
      } else {
        await productsApi.createProduct(productData, imageFile);
      }

      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Greide ikke ${isEditing ? "oppdatere" : "opprette"} vare`,
      );
      console.error("Greide ikke lagre vare:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-gradient animate-fadeIn">
      <h2 className="text-3xl font-bold gradient-text mb-6">
        {isEditing ? "✏️ Rediger vare" : "✨ Legg til ny vare"}
      </h2>

      {error && (
        <div
          className="mb-6 p-4 rounded-2xl text-white font-bold text-center animate-slideIn"
          style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
        >
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
            Link varer til en bok dersom de henger sammen (e.g., merch til en
            bok i bibiloteket)
          </p>
        </div>

        {/* Size Variations */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            📐 Varianter (valgfritt)
          </label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {sizes.map(size => (
              <span
                key={size}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
              >
                {size}
                <button
                  type="button"
                  onClick={() => removeSize(size)}
                  className="leading-none hover:opacity-70 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={sizeInput}
              onChange={e => setSizeInput(e.target.value)}
              onKeyDown={handleSizeKeyDown}
              placeholder="F.eks. XS, S, M, L, XL eller 38, 39..."
              className="input-field flex-1"
              maxLength={10}
            />
            <button
              type="button"
              onClick={addSize}
              className="px-4 py-2 rounded-xl text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
            >
              + Legg til
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Trykk Enter eller klikk "+ Legg til" for å legge til en størrelse</p>
        </div>

        {/* Product Image */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            🖼️ Produktbilde
          </label>
          <div
            className="relative w-full h-48 rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-purple-300 hover:border-purple-500 transition-all flex items-center justify-center bg-purple-50"
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="Forhåndsvisning"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Klikk for å endre</span>
                </div>
              </>
            ) : (
              <div className="text-center text-purple-400">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm font-semibold">Klikk for å laste opp bilde</p>
                <p className="text-xs mt-1">PNG, JPG, WEBP — maks 5MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
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
          <label
            htmlFor="isAvailable"
            className="text-sm font-bold text-gray-700 cursor-pointer select-none"
          >
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
            {loading
              ? isEditing
                ? "⏳ Oppdatere..."
                : "⏳ Oppretter..."
              : isEditing
                ? "✏️ Oppdater vare"
                : "✨ Opprett vare"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg text-lg"
            style={{
              background: "linear-gradient(135deg, #9ca3af, #6b7280)",
              color: "white",
            }}
          >
            Avbryt
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
