import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { meetingsApi } from '../../api/meetingsApi';
import { booksApi } from '../../api/booksApi';
import { useAuth } from '../../contexts/AuthContext';

const NextMeeting = () => {
  const { user } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRSVPing, setIsRSVPing] = useState(false);

  useEffect(() => {
    fetchNextMeeting();
  }, []);

  const fetchNextMeeting = async () => {
    try {
      setLoading(true);
      const data = await meetingsApi.getNextMeeting();
      if (data.meeting) {
        setMeeting(data.meeting);
      }
    } catch (error) {
      console.error('Failed to fetch next meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async () => {
    if (!meeting || isRSVPing) return;

    try {
      setIsRSVPing(true);
      const data = await meetingsApi.rsvpMeeting(meeting._id);
      setMeeting(data.meeting);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to RSVP');
    } finally {
      setIsRSVPing(false);
    }
  };

  if (loading) {
    return (
      <div className="container-gradient text-center py-12 animate-fadeIn">
        <div className="animate-pulse">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-gray-600 text-lg font-bold">Laster neste møte...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div
        className="container-gradient text-center py-12 animate-fadeIn"
        style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))' }}
      >
        <div className="text-6xl mb-4">📅</div>
        <h2 className="text-3xl font-bold gradient-text mb-3">Ingen kommende møter</h2>
        <p className="text-gray-600 mb-6 text-lg">Sjekk tilbake senere for neste bokklubbsamling!</p>
        <Link
          to="/meetings"
          className="btn-primary inline-block"
        >
          Se alle møtene
        </Link>
      </div>
    );
  }

  // Format date and time
  const meetingDate = new Date(meeting.date);
  const formattedDate = meetingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = meeting.time || meetingDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate days until meeting
  const now = new Date();
  const daysUntil = Math.ceil((meetingDate - now) / (1000 * 60 * 60 * 24));
  const isToday = daysUntil === 0;
  const isTomorrow = daysUntil === 1;

  // Check if user is attending
  const isAttending = meeting.attendees?.some(attendee => {
    // Handle both populated user objects and ObjectId references
    const attendeeId = attendee._id || attendee;
    return attendeeId.toString() === user?._id?.toString();
  });
  const attendeeCount = meeting.attendeeCount || meeting.attendees?.length || 0;
  const isFull = meeting.isFull || (meeting.maxAttendees > 0 && attendeeCount >= meeting.maxAttendees);

  return (
    <div className="container-gradient animate-fadeIn overflow-hidden" style={{ position: 'relative' }}>
      {/* Decorative gradient background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{ background: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb, #f5576c)' }}
      ></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3 animate-bounce">🎉</div>
          <h2 className="text-4xl font-bold gradient-text mb-2">Neste bokklubbmøte!</h2>
          {isToday && (
            <p className="text-2xl font-bold" style={{ color: '#f5576c' }}>
              📢 IDAG!
            </p>
          )}
          {isTomorrow && (
            <p className="text-2xl font-bold" style={{ color: '#f5576c' }}>
              📢 I morgen!
            </p>
          )}
          {!isToday && !isTomorrow && daysUntil > 0 && (
            <p className="text-xl text-gray-600 font-bold">
              om {daysUntil} {daysUntil === 1 ? 'dag' : 'dager'}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column - Meeting details */}
          <div className="space-y-4">
            {/* Title */}
            <div
              className="p-6 rounded-2xl text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
            >
              <h3 className="text-3xl font-bold mb-2">{meeting.title}</h3>
              <div className="flex items-center gap-2 text-lg mb-2">
                <span>📅</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-lg mb-2">
                <span>🕐</span>
                <span>{formattedTime}</span>
              </div>
              {meeting.location && (
                <div className="flex items-center gap-2 text-lg">
                  <span>📍</span>
                  <span>{meeting.location}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {meeting.description && (
              <div className="p-5 rounded-2xl bg-white/80">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {meeting.description}
                </p>
              </div>
            )}

            {/* Attendees */}
            <div
              className="p-5 rounded-2xl text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xl font-bold">👥 Hvem kommer?</h4>
                <span className="text-lg font-bold">
                  {attendeeCount} {attendeeCount === 1 ? 'medlem' : 'medlemmer'}
                </span>
              </div>

              {meeting.attendees && meeting.attendees.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {meeting.attendees.slice(0, 8).map((attendee, index) => {
                    // Handle case where attendee might be just an ObjectId or string
                    if (typeof attendee === 'string' || !attendee.username) return null;
                    const displayName = attendee?.displayName || attendee?.username || 'User';
                    const attendeeId = attendee._id || attendee.toString?.() || index;

                    return (
                    <div
                      key={`attendee-${attendeeId}-${index}`}
                      className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-sm">
                        {attendee.avatar ? (
                          <img
                            src={`http://localhost:5000/uploads/avatars/${attendee.avatar}`}
                            alt={displayName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-purple-600 font-bold">
                            {displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {displayName}
                      </span>
                    </div>
                  )})}
                  {attendeeCount > 8 && (
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                      <span className="text-sm font-bold">+{attendeeCount - 8} flere</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right column - Book and actions */}
          <div className="space-y-4">
            {/* Book */}
            {meeting.book && (
              <div className="p-6 rounded-2xl bg-white shadow-lg">
                <h4 className="font-bold text-gray-900 mb-4 text-xl">📚 Vi skal diskutere:</h4>
                <Link
                  to={`/books/${meeting.book._id}`}
                  className="block transform transition-all hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    {meeting.book.coverImage && (
                      <img
                        src={booksApi.getCoverUrl(meeting.book.coverImage)}
                        alt={meeting.book.title}
                        className="w-48 h-72 object-cover rounded-2xl shadow-2xl mb-4 transform transition-transform hover:scale-110"
                      />
                    )}
                    <h5 className="text-2xl font-bold gradient-text mb-2">
                      {meeting.book.title}
                    </h5>
                    <p className="text-gray-600 text-lg">by {meeting.book.author}</p>
                  </div>
                </Link>
              </div>
            )}

            {/* RSVP Button */}
            <button
              onClick={handleRSVP}
              disabled={isRSVPing || (!isAttending && isFull)}
              className={`w-full py-6 rounded-2xl font-bold text-white text-2xl shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                isRSVPing ? 'animate-pulse' : ''
              }`}
              style={{
                background: isAttending
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #10b981, #14b8a6)'
              }}
            >
              {isRSVPing ? '⏳ Behandler...' : isAttending ? '✓ Du deltar!' : isFull ? '😔 Møtet er fult' : '🎉 Jeg vil være med! '}
            </button>

            {/* View all meetings link */}
            <Link
              to="/meetings"
              className="block text-center py-4 rounded-2xl font-bold text-white shadow-lg transition-all transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
            >
              📅 Se alle møtene
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextMeeting;
