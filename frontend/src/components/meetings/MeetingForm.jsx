import { useState, useEffect } from 'react';
import { meetingsApi } from '../../api/meetingsApi';
import { booksApi } from '../../api/booksApi';

const MeetingForm = ({ meeting = null, onSuccess, onCancel }) => {
  const isEditing = !!meeting;

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    bookId: '',
    maxAttendees: 0,
    status: 'upcoming',
    notes: ''
  });

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBooks();

    if (meeting) {
      setFormData({
        title: meeting.title || '',
        date: meeting.date ? new Date(meeting.date).toISOString().split('T')[0] : '',
        time: meeting.time || '',
        location: meeting.location || '',
        description: meeting.description || '',
        bookId: meeting.book?._id || '',
        maxAttendees: meeting.maxAttendees || 0,
        status: meeting.status || 'upcoming',
        notes: meeting.notes || ''
      });
    }
  }, [meeting]);

  const fetchBooks = async () => {
    try {
      const data = await booksApi.getBooks();
      setBooks(data.books || []);
    } catch (err) {
      console.error('Failed to fetch books:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
        notes: formData.notes
      };

      if (isEditing) {
        await meetingsApi.updateMeeting(meeting._id, meetingData);
      } else {
        await meetingsApi.createMeeting(meetingData);
      }

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} meeting`);
      console.error('Error saving meeting:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-gradient animate-fadeIn">
      <h2 className="text-3xl font-bold gradient-text mb-6">
        {isEditing ? '✏️ Rediger møte' : '✨ Opprett nytt møte'}
      </h2>

      {error && (
        <div className="mb-6 p-4 rounded-2xl text-white font-bold text-center animate-slideIn" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Møtetittel <span className="text-red-500">*</span>
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

        {/* Date and Time */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Dato <span className="text-red-500">*</span>
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
          <select
            name="bookId"
            value={formData.bookId}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Ingen bok valgt</option>
            {books.map((book) => (
              <option key={book._id} value={book._id}>
                {book.title} by {book.author}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Link this meeting to a specific book we'll be discussing
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
        {isEditing && formData.status === 'past' && (
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
            {loading ? (isEditing ? '⏳ Oppdaterer...' : '⏳ Oppretter...') : (isEditing ? '✏️ Oppdater møte' : '✨ Opprett møte')}
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

export default MeetingForm;
