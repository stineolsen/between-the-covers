import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import activityApi from '../../api/activityApi';

const AVATAR_COLORS = [
  'linear-gradient(135deg, #7c3aed, #a855f7)',
  'linear-gradient(135deg, #db2777, #f472b6)',
  'linear-gradient(135deg, #0891b2, #22d3ee)',
  'linear-gradient(135deg, #059669, #34d399)',
  'linear-gradient(135deg, #d97706, #fbbf24)',
  'linear-gradient(135deg, #dc2626, #f87171)',
];

const avatarColor = (name = '') => {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

const relativeTime = (date) => {
  const diffMs = Date.now() - new Date(date);
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  const weeks = Math.floor(days / 7);
  if (mins < 1) return 'akkurat nå';
  if (mins < 60) return `${mins} min siden`;
  if (hours < 24) return `${hours} time${hours > 1 ? 'r' : ''} siden`;
  if (days === 1) return 'i går';
  if (days < 7) return `${days} dager siden`;
  if (weeks < 5) return `${weeks} uke${weeks > 1 ? 'r' : ''} siden`;
  return new Date(date).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long' });
};

const Stars = ({ rating }) => {
  const full = Math.round(rating);
  return (
    <span className="text-yellow-400 text-sm leading-none">
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
  );
};

const Avatar = ({ user }) => {
  const name = user?.displayName || user?.username || '?';
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
      style={{ background: avatarColor(name) }}
    >
      {name[0]?.toUpperCase()}
    </div>
  );
};

const BookThumb = ({ book }) => {
  if (!book?.coverImage) return null;
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return (
    <img
      src={`${API_URL}/uploads/books/${book.coverImage}`}
      alt={book.title}
      className="w-8 h-12 object-cover rounded shadow flex-shrink-0"
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
};

const ActivityItem = ({ activity }) => {
  const { type } = activity;

  if (type === 'review') {
    const { user, book, rating, reviewId } = activity;
    const name = user?.displayName || user?.username || 'Ukjent';
    return (
      <div className="flex items-center gap-3">
        <Avatar user={user} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-snug">
            <span className="font-semibold">{name}</span>
            {' ga '}
            <Stars rating={rating} />
            {' til '}
            {book ? (
              <Link to={`/books/${book._id}`} className="font-semibold text-purple-700 hover:underline">
                {book.title}
              </Link>
            ) : 'en bok'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{relativeTime(activity.date)}</p>
        </div>
        <BookThumb book={book} />
      </div>
    );
  }

  if (type === 'status') {
    const { user, book, status } = activity;
    const name = user?.displayName || user?.username || 'Ukjent';
    const verb =
      status === 'read' ? 'har lest' :
      status === 'currently-reading' ? 'leser nå' :
      'la til';
    const suffix = status === 'to-read' ? ' på leserlisten' : '';
    return (
      <div className="flex items-center gap-3">
        <Avatar user={user} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-snug">
            <span className="font-semibold">{name}</span>
            {` ${verb} `}
            {book ? (
              <Link to={`/books/${book._id}`} className="font-semibold text-purple-700 hover:underline">
                {book.title}
              </Link>
            ) : 'en bok'}
            {suffix}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{relativeTime(activity.date)}</p>
        </div>
        <BookThumb book={book} />
      </div>
    );
  }

  if (type === 'meeting') {
    const { meeting, attendees, bookTitle } = activity;
    const count = attendees?.length || 0;
    return (
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(251,113,133,0.3))' }}
        >
          📅
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-snug font-semibold truncate">
            {meeting?.title}
            {bookTitle && <span className="font-normal text-gray-600"> — {bookTitle}</span>}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {count > 0
              ? `${count} deltaker${count !== 1 ? 'e' : ''} · `
              : ''}
            {meeting?.date
              ? new Date(meeting.date).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long' })
              : ''}
          </p>
          {count > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {attendees.slice(0, 5).map((att, i) => (
                <div
                  key={att._id || i}
                  title={att.displayName || att.username}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: avatarColor(att.displayName || att.username || '?') }}
                >
                  {(att.displayName || att.username || '?')[0]?.toUpperCase()}
                </div>
              ))}
              {count > 5 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
                  +{count - 5}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activityApi.getActivity(25)
      .then(data => setActivities(data.activities || []))
      .catch(err => console.error('Klarte ikke laste aktivitetsstrøm:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-10 animate-fadeIn">
      <h2 className="text-xl font-bold gradient-text mb-4">📰 Siste aktivitet</h2>
      <div
        className="rounded-2xl p-4 sm:p-6 space-y-4"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.07), rgba(251,113,133,0.12))' }}
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-center text-gray-500 py-6">Ingen aktivitet ennå 🌱</p>
        ) : (
          activities.map((activity, i) => (
            <div key={i}>
              <ActivityItem activity={activity} />
              {i < activities.length - 1 && (
                <div className="border-b border-purple-100 mt-4" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
