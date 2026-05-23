import { useState } from "react";
import { booksApi } from "../../api/booksApi";

const EMPTY_FORM = {
  title: "",
  author: "",
  description: "",
  publishedYear: "",
  pageCount: "",
  isbn: "",
  genres: [],
  language: "Norsk",
  series: "",
  seriesNumber: "",
  publisher: "",
  bookclubMonth: "",
  audiobookLink: "",
  ebookLink: "",
  calibreDownloadLink: "",
};

const AdminBookForm = ({ book, onSuccess, onCancel }) => {
  const isEdit = !!book;

  const [form, setForm] = useState(() => {
    if (!book) return EMPTY_FORM;
    return {
      title: book.title || "",
      author: book.author || "",
      description: book.description || "",
      publishedYear: book.publishedYear || "",
      pageCount: book.pageCount || "",
      isbn: book.isbn || "",
      genres: book.genres || [],
      language: book.language || "Norsk",
      series: book.series || "",
      seriesNumber: book.seriesNumber || "",
      publisher: book.publisher || "",
      bookclubMonth: book.bookclubMonth || "",
      audiobookLink: book.libraryLinks?.audiobook || "",
      ebookLink: book.libraryLinks?.ebook || "",
      calibreDownloadLink: book.calibreDownloadLink || "",
    };
  });

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(
    isEdit && book.coverImage ? booksApi.getCoverUrl(book.coverImage) : null
  );
  const [genreInput, setGenreInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const addGenre = () => {
    const g = genreInput.trim();
    if (g && !form.genres.includes(g)) {
      setForm((prev) => ({ ...prev, genres: [...prev.genres, g] }));
    }
    setGenreInput("");
  };

  const removeGenre = (g) =>
    setForm((prev) => ({ ...prev, genres: prev.genres.filter((x) => x !== g) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        author: form.author,
        description: form.description,
        publishedYear: form.publishedYear ? parseInt(form.publishedYear) : undefined,
        pageCount: form.pageCount ? parseInt(form.pageCount) : undefined,
        isbn: form.isbn || undefined,
        genres: form.genres,
        language: form.language,
        series: form.series || undefined,
        seriesNumber: form.seriesNumber ? parseInt(form.seriesNumber) : undefined,
        publisher: form.publisher || undefined,
        bookclubMonth: form.bookclubMonth || undefined,
        calibreDownloadLink: form.calibreDownloadLink || undefined,
        libraryLinks: {
          audiobook: form.audiobookLink || null,
          ebook: form.ebookLink || null,
        },
      };

      if (coverFile) payload.coverImage = coverFile;

      let result;
      if (isEdit) {
        result = await booksApi.updateBook(book._id, payload);
      } else {
        result = await booksApi.createBook(payload);
      }
      onSuccess(result.book, isEdit);
    } catch (err) {
      setError(err.response?.data?.message || "Greide ikke lagre bok.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-2xl font-bold gradient-text">
          {isEdit ? "✏️ Rediger bok" : "📚 Legg til bok (admin)"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-700 font-bold text-2xl transition-colors"
        >
          ×
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-600 font-semibold text-sm">
          {error}
        </div>
      )}

      {/* Cover */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Bokomslag</label>
        <div className="flex items-center gap-4">
          {coverPreview && (
            <img
              src={coverPreview}
              alt="Forhåndsvisning"
              className="h-28 w-20 object-cover rounded-xl shadow-md"
            />
          )}
          <label className="cursor-pointer px-4 py-2 rounded-full font-bold text-white text-sm shadow transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
            {coverPreview ? "Bytt bilde" : "Last opp bilde"}
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Title & Author */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Tittel *</label>
          <input name="title" required value={form.title} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Forfatter *</label>
          <input name="author" required value={form.author} onChange={handleChange} className="input-field" />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Beskrivelse</label>
        <textarea
          name="description"
          rows="3"
          value={form.description}
          onChange={handleChange}
          className="input-field"
          placeholder="Kort beskrivelse av boken"
        />
      </div>

      {/* Year / Pages / ISBN */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Utgivelsesår</label>
          <input name="publishedYear" type="number" value={form.publishedYear} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Antall sider</label>
          <input name="pageCount" type="number" value={form.pageCount} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">ISBN</label>
          <input name="isbn" value={form.isbn} onChange={handleChange} className="input-field" />
        </div>
      </div>

      {/* Language / Publisher / Bookclub month */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Språk</label>
          <input name="language" value={form.language} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Forlag</label>
          <input name="publisher" value={form.publisher} onChange={handleChange} className="input-field" placeholder="F.eks. Gyldendal" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">📅 Bokklubbmåned</label>
          <input name="bookclubMonth" value={form.bookclubMonth} onChange={handleChange} className="input-field" placeholder="F.eks. Januar 2026" />
        </div>
      </div>

      {/* Series */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Serie</label>
          <input name="series" value={form.series} onChange={handleChange} className="input-field" placeholder="F.eks. Harry Potter" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1"># i serien</label>
          <input name="seriesNumber" type="number" value={form.seriesNumber} onChange={handleChange} className="input-field" />
        </div>
      </div>

      {/* Library links */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">🔗 Lenker</label>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">🎧 Lydbok (URL)</label>
            <input name="audiobookLink" type="url" value={form.audiobookLink} onChange={handleChange} className="input-field" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">📱 E-bok (URL)</label>
            <input name="ebookLink" type="url" value={form.ebookLink} onChange={handleChange} className="input-field" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">📥 Calibre nedlasting (URL)</label>
            <input name="calibreDownloadLink" type="url" value={form.calibreDownloadLink} onChange={handleChange} className="input-field" placeholder="https://..." />
          </div>
        </div>
      </div>

      {/* Genres */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Sjangere</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={genreInput}
            onChange={(e) => setGenreInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGenre(); } }}
            className="input-field flex-1"
            placeholder="Legg til sjanger og trykk Enter"
          />
          <button type="button" onClick={addGenre} className="btn-accent">Legg til</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.genres.map((g) => (
            <span
              key={g}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #f093fb, #f5576c)" }}
            >
              {g}
              <button type="button" onClick={() => removeGenre(g)} className="hover:text-red-200 font-bold">×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? "⏳ Lagrer..."
            : isEdit
              ? "💾 Lagre endringer"
              : "✨ Legg til i biblioteket"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 rounded-full font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          Avbryt
        </button>
      </div>
    </form>
  );
};

export default AdminBookForm;
