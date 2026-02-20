import { useState } from 'react';
import { Link } from 'react-router-dom';
import { booksApi } from '../../api/booksApi';
import { useAuth } from '../../contexts/AuthContext';

const MeetingCard = ({ meeting, onRSVP, onEdit, onDelete }) => {
  const { user, isAdmin } = useAuth();
  const [isRSVPing, setIsRSVPing] = useState(false);

  // Format date and time
  const meetingDate = new Date(meeting.date);
  const formattedDate = meetingDate.toLocaleDateString('nb-NO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = meeting.time || meetingDate.toLocaleTimeString('nb-NO', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Check if user is attending
  const isAttending = meeting.attendees?.some(attendee => {
    // Handle both populated user objects and ObjectId references
    const attendeeId = attendee._id || attendee;
    return attendeeId.toString() === user?._id?.toString();
  });
  const attendeeCount = meeting.attendeeCount || meeting.attendees?.length || 0;
  const isFull = meeting.isFull || (meeting.maxAttendees > 0 && attendeeCount >= meeting.maxAttendees);

  // Get status gradient
  const getStatusGradient = () => {
    switch (meeting.status) {
      case 'upcoming':
        return 'linear-gradient(135deg, #667eea, #764ba2)';
      case 'past':
        return 'linear-gradient(135deg, #f093fb, #f5576c)';
      case 'cancelled':
        return 'linear-gradient(135deg, #6b7280, #4b5563)';
      default:
        return 'linear-gradient(135deg, #667eea, #764ba2)';
    }
  };

  // Get status text in Norwegian
  const getStatusText = () => {
    switch (meeting.status) {
      case 'upcoming':
        return 'Kommende';
      case 'past':
        return 'Tidligere';
      case 'cancelled':
        return 'Avlyst';
      default:
        return 'Kommende';
    }
  };

  // Handle RSVP
  const handleRSVP = async () => {
    if (isRSVPing) return;

    try {
      setIsRSVPing(true);
      await onRSVP(meeting._id);
    } catch (error) {
      console.error('RSVP error:', error);
    } finally {
      setIsRSVPing(false);
    }
  };

  return (
    <div className="container-gradient transform transition-all hover:scale-102 animate-fadeIn">
      {/* Status Badge */}
      <div
        className="absolute top-4 right-4 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg"
        style={{ background: getStatusGradient() }}
      >
        {getStatusText()}
      </div>

      {/* Date Badge */}
      <div className="mb-4">
        <div
          className="inline-block text-white px-6 py-3 rounded-2xl font-bold shadow-lg"
          style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}
        >
          <div className="text-3xl mb-1">📅</div>
          <div className="text-sm">{formattedDate}</div>
          <div className="text-lg font-bold">{formattedTime}</div>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold gradient-text mb-2">{meeting.title}</h3>

      {/* Location */}
      {meeting.location && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">📍</span>
          <span className="text-gray-700 font-medium">{meeting.location}</span>
        </div>
      )}

      {/* Description */}
      {meeting.description && (
        <p className="text-gray-600 mb-4 line-clamp-3">{meeting.description}</p>
      )}

      {/* Book (if linked) */}
      {meeting.book && (
        <div className="mb-4 p-4 rounded-2xl bg-white/50">
          <div className="flex items-center gap-3">
            {meeting.book.coverImage && (
              <img
                src={booksApi.getCoverUrl(meeting.book.coverImage)}
                alt={meeting.book.title}
                className="w-16 h-24 object-cover rounded-lg shadow-md"
              />
            )}
            <div>
              <p className="text-sm text-gray-600 font-semibold">📚 Diskuterer:</p>
              <Link
                to={`/books/${meeting.book._id}`}
                className="font-bold text-lg gradient-text hover:underline"
              >
                {meeting.book.title}
              </Link>
              <p className="text-gray-600 text-sm">by {meeting.book.author}</p>
            </div>
          </div>
        </div>
      )}

      {/* Attendees */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <span className="text-gray-700 font-bold">
              {attendeeCount} {attendeeCount === 1 ? 'medlem' : 'medlemmer'} påmeldt
            </span>
          </div>
          {meeting.maxAttendees > 0 && (
            <span className="text-gray-600 text-sm">
              (Maks: {meeting.maxAttendees})
            </span>
          )}
        </div>

        {/* Attendee avatars */}
        {meeting.attendees && meeting.attendees.length > 0 && (
          <div className="flex -space-x-2">
            {meeting.attendees.slice(0, 5).map((attendee, index) => {
              // Handle case where attendee might be just an ObjectId or string
              if (typeof attendee === 'string' || !attendee.username) return null;
              const displayName = attendee?.displayName || attendee?.username || 'User';
              const attendeeId = attendee._id || attendee.toString?.() || index;

              return (
              <div
                key={`attendee-${attendeeId}-${index}`}
                className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-lg flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                title={displayName}
              >
                {attendee.avatar ? (
                  <img
                    src={`http://localhost:5000/uploads/avatars/${attendee.avatar}`}
                    alt={displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            )})}
            {attendeeCount > 5 && (
              <div
                className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6b7280, #4b5563)' }}
              >
                <span className="text-white text-xs font-bold">+{attendeeCount - 5}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notes (for past meetings) */}
      {meeting.status === 'past' && meeting.notes && (
        <div className="mb-4 p-4 rounded-2xl" style={{ background: 'rgba(240, 147, 251, 0.1)' }}>
          <h4 className="font-bold text-gray-900 mb-2">📝 Møtenotater:</h4>
          <p className="text-gray-700 whitespace-pre-line">{meeting.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {/* RSVP Button (only for upcoming meetings) */}
        {meeting.status === 'upcoming' && (
          <button
            onClick={handleRSVP}
            disabled={isRSVPing || (!isAttending && isFull)}
            className={`flex-1 py-3 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              isRSVPing ? 'animate-pulse' : ''
            }`}
            style={{
              background: isAttending
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : 'linear-gradient(135deg, #10b981, #14b8a6)'
            }}
          >
            {isRSVPing ? 'Behandler...' : isAttending ? '✓ Påmeldt' : isFull ? 'Møtet er fullt' : '+ Meld deg på'}
          </button>
        )}

        {/* Admin Actions */}
        {isAdmin && (
          <>
            <button
              onClick={() => onEdit(meeting)}
              className="flex-1 py-3 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            >
              ✏️ Rediger
            </button>
            <button
              onClick={() => onDelete(meeting._id)}
              className="flex-1 py-3 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
            >
              🗑️ Slett
            </button>
          </>
        )}
      </div>

      {/* Created by */}
      {meeting.createdBy && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Opprettet av {meeting.createdBy.displayName || meeting.createdBy.username}
        </div>
      )}
    </div>
  );
};

export default MeetingCard;
