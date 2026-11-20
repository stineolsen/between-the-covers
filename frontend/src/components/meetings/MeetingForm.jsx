import { useState, useEffect } from "react";
import { meetingsApi } from "../../api/meetingsApi";
import { booksApi } from "../../api/booksApi";

// Accent/case-insensitive match: "nesbo" finds "Nesbø"
const fold = (t) =>
  (t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae");

// Search-as-you-type over the (already loaded) library instead of one long
// dropdown. Every word has to match the title or author.
const BookSearchField = ({ books, selectedId, onSelect }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = books.find((b) => b._id === selectedId);

  const words = fold(query).split(/\s+/).filter(Boolean);
  const results = words.length
    ? books.filter((b) => {
        const hay = fold(`${b.title} ${b.author}`);
        return words.every((w) => hay.includes(w));
      }).slice(0, 8)
    : [];

  if (selected) {
    return (
      <div className="input-field flex items-center gap-2">
        <span className="flex-1 min-w-0 truncate">
          <strong>{selected.title}</strong> – {selected.author}
        </span>
        <button
          type="button"
          onClick={() => {
            onSelect("");
            setQuery("");
          }}
          className="text-xs font-bold flex-shrink-0"
          style={{ color: "var(--color-terracotta)" }}
        >
          Fjern
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="search"
        className="input-field w-full"
        placeholder="Søk etter tittel eller forfatter…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          // Enter picks the top hit instead of submitting the form
          if (e.key === "Enter" && results.length) {
            e.preventDefault();
            onSelect(results[0]._id);
            setOpen(false);
          }
        }}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="meeting-book-results"
      />
      {open && words.length > 0 && (
        <div
          id="meeting-book-results"
          role="listbox"
          className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden z-20 max-h-72 overflow-y-auto"
          style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", boxShadow: "0 10px 24px rgba(0,0,0,0.14)" }}
        >
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm" style={{ color: "var(--color-text-faint)" }}>
              Ingen bøker funnet
            </p>
          ) : (
            results.map((b) => (
              <button
                key={b._id}
                type="button"
                role="option"
                aria-selected="false"
                className="block w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-sunken)]"
                style={{ borderBottom: "1px solid var(--color-border)" }}
                onMouseDown={() => {
                  onSelect(b._id);
                  setOpen(false);
                }}
              >
                <span className="block font-semibold">{b.title}</span>
                <span className="block text-xs" style={{ color: "var(--color-text-faint)" }}>
                  {b.author}
                  {b.bookclubMonth ? ` · bokklubb ${b.bookclubMonth}` : ""}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const MeetingForm = ({ meeting = null, onSuccess, onCancel }) => {
  const isEditing = !!meeting;

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    bookId: "",
    maxAttendees: 0,
    status: "upcoming",
    notes: "",
    type: "bookclub",
  });

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    fetchBooks();

    if (meeting) {
      setFormData({
        title: meeting.title || "",
        date: meeting.date
          ? new Date(meeting.date).toISOString().split("T")[0]
          : "",
        time: meeting.time || "",
        location: meeting.location || "",
        description: meeting.description || "",
        bookId: meeting.book?._id || "",
        maxAttendees: meeting.maxAttendees || 0,
        status: meeting.status || "upcoming",
        notes: meeting.notes || "",
        type: meeting.type === "side" ? "side" : "bookclub",
      });
    }
  }, [meeting]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const meetingData = {
        title: formData.title,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        description: formData.description,
        bookId: formData.bookId || null,
        maxAttendees: parseInt(formData.maxAttendees) || 0,
        status: formData.status,
        notes: formData.notes,
        type: formData.type,
      };

      if (isEditing) {
        await meetingsApi.updateMeeting(meeting._id, meetingData);
      } else {
        await meetingsApi.createMeeting(meetingData);
      }

      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} meeting`,
      );
      console.error("Error saving meeting:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-gradient animate-fadeIn">
      <h2 className="text-3xl font-bold gradient-text mb-6">
        {isEditing ? "✏️ Rediger møte" : "✨ Opprett nytt møte"}
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
        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Møtetittel <span style={{ color: "var(--color-terracotta)" }}>*</span>
          </label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="input-field"
            placeholder="e.g., Monthly Bookclub Discussion"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
          <div className="flex gap-2 flex-wrap">
            {[
              ["bookclub", "📚 Bokklubbmøte"],
              ["side", "🎉 Sideevent"],
            ].map(([value, label]) => (
              <label
                key={value}
                className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer text-sm font-bold border-2"
                style={
                  formData.type === value
                    ? { borderColor: "var(--color-primary)", background: "var(--color-wine-tint)", color: "var(--color-primary)" }
                    : { borderColor: "var(--color-border)", color: "var(--color-text-muted)" }
                }
              >
                <input
                  type="radio"
                  name="type"
                  value={value}
                  checked={formData.type === value}
                  onChange={handleChange}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-faint)" }}>
            Sideeventer teller ikke med i oppmøte-statistikken eller møte-lesemerkene.
          </p>
        </div>

        {/* Date and Time */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Dato <span style={{ color: "var(--color-terracotta)" }}>*</span>
            </label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Tidspunkt
            </label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Sted
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="input-field"
            placeholder="e.g., Cafe Downtown or Zoom Link"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Beskrivelse / Agenda
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="input-field"
            placeholder="What will we discuss? Any special topics or themes?"
          />
        </div>

        {/* Book Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            📚 Relatert bok (valgfritt)
          </label>
          <BookSearchField
            books={books}
            selectedId={formData.bookId}
            onSelect={(bookId) => setFormData((prev) => ({ ...prev, bookId }))}
          />
          <p className="text-xs mt-1" style={{ color: "var(--color-text-faint)" }}>
            Knytt møtet til boken dere skal snakke om
          </p>
        </div>

        {/* Max Attendees */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Maksimalt antall medlemmer (0 = ubegrenset)
          </label>
          <input
            type="number"
            name="maxAttendees"
            min="0"
            value={formData.maxAttendees}
            onChange={handleChange}
            className="input-field"
            placeholder="0"
          />
        </div>

        {/* Status (for editing) */}
        {isEditing && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input-field"
            >
              <option value="upcoming">Kommende</option>
              <option value="past">Tidligere</option>
              <option value="cancelled">Avlyst</option>
            </select>
          </div>
        )}

        {/* Notes (for past meetings) */}
        {isEditing && formData.status === "past" && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Møtenotater / Sammendrag
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="5"
              className="input-field"
              placeholder="What did we discuss? Key takeaways, highlights, etc."
            />
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? isEditing
                ? "⏳ Oppdaterer..."
                : "⏳ Oppretter..."
              : isEditing
                ? "✏️ Oppdater møte"
                : "✨ Opprett møte"}
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

export default MeetingForm;
