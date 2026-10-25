import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import activityApi from '../../api/activityApi';
import { useToast } from '../../contexts/useToast';
import { useAuth } from '../../contexts/useAuth';
import UserAvatar from './UserAvatar';

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
    <span className="inline-flex items-center gap-1 text-sm leading-none">
      <span>
        <span style={{ color: "var(--color-secondary-solid)" }}>{'★'.repeat(full)}</span>
        <span style={{ color: "var(--color-border)" }}>{'★'.repeat(5 - full)}</span>
      </span>
      <span className="text-xs text-text-faint">{rating.toFixed(1)}</span>
    </span>
  );
};

// Both wrap to the member's public profile - omitted (falls back to plain
// text/avatar) when a user wasn't populated, which happens for a couple of
// edge-case feed rows (e.g. a deleted account).
const NameLink = ({ user, className = 'font-semibold' }) => {
  const name = user?.displayName || user?.username || 'Ukjent';
  if (!user?._id) return <span className={className}>{name}</span>;
  return (
    <Link to={`/members/${user._id}`} className={`${className} hover:underline`}>
      {name}
    </Link>
  );
};

const AvatarLink = ({ user, className, title }) => {
  if (!user?._id) return <UserAvatar user={user} className={className} title={title} />;
  return (
    <Link to={`/members/${user._id}`} className="flex-shrink-0">
      <UserAvatar user={user} className={className} title={title} />
    </Link>
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

const RESULT_COLOR = {
  correct: 'var(--color-sage)',
  author: 'var(--color-secondary-deep)',
  wrong: 'var(--color-terracotta)',
};

const ActivityBody = ({ activity }) => {
  const { type } = activity;

  if (type === 'review') {
    const { user, book, rating } = activity;
    return (
      <div className="flex items-center gap-3">
        <AvatarLink user={user} className="w-7 h-7 sm:w-9 sm:h-9 rounded-full font-bold text-sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text leading-snug">
            <NameLink user={user} />
            {' ga '}
            <Stars rating={rating} />
            {' til '}
            {book ? (
              <Link to={`/books/${book._id}`} className="font-semibold text-primary hover:underline">
                {book.title}
              </Link>
            ) : 'en bok'}
          </p>
          <p className="text-xs text-text-faint mt-0.5">{relativeTime(activity.date)}</p>
        </div>
        <BookThumb book={book} />
      </div>
    );
  }

  if (type === 'status') {
    const { user, book, status } = activity;
    const verb =
      status === 'read' ? 'har lest' :
      status === 'currently-reading' ? 'leser nå' :
      status === 'dnf' ? 'ga opp' :
      'la til';
    const suffix = status === 'to-read' ? ' på leserlisten' : '';
    return (
      <div className="flex items-center gap-3">
        <AvatarLink user={user} className="w-7 h-7 sm:w-9 sm:h-9 rounded-full font-bold text-sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text leading-snug">
            <NameLink user={user} />
            {` ${verb} `}
            {book ? (
              <Link to={`/books/${book._id}`} className="font-semibold text-primary hover:underline">
                {book.title}
              </Link>
            ) : 'en bok'}
            {suffix}
          </p>
          <p className="text-xs text-text-faint mt-0.5">{relativeTime(activity.date)}</p>
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
          className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-base sm:text-lg flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(251,113,133,0.3))' }}
        >
          📅
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text leading-snug font-semibold truncate">
            {meeting?.title}
            {bookTitle && <span className="font-normal text-text-muted"> — {bookTitle}</span>}
          </p>
          <p className="text-xs text-text-faint mt-0.5">
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
                <AvatarLink
                  key={att._id || i}
                  user={att}
                  title={att.displayName || att.username}
                  className="w-6 h-6 rounded-full text-xs font-bold"
                />
              ))}
              {count > 5 && (
                <div className="w-6 h-6 rounded-full bg-sunken flex items-center justify-center text-text-muted text-xs font-bold">
                  +{count - 5}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === 'advent') {
    const { user, day, points, squares } = activity;
    return (
      <div className="flex items-center gap-3">
        <AvatarLink user={user} className="w-7 h-7 sm:w-9 sm:h-9 rounded-full font-bold text-sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text leading-snug">
            <NameLink user={user} />
            {` løste luke ${day}`}
            {points > 0 && <span className="text-text-muted"> — {points} poeng</span>}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {(squares || []).map((result, i) => (
              <span
                key={i}
                className="w-3.5 h-3.5 rounded-sm"
                style={{ background: RESULT_COLOR[result] || 'var(--color-border)' }}
              />
            ))}
          </div>
          <p className="text-xs text-text-faint mt-1">{relativeTime(activity.date)}</p>
        </div>
      </div>
    );
  }

  return null;
};

// Mirrors backend/src/constants/feedConfig.js's REACTION_EMOJI - keep
// both lists in sync. Only emoji someone's actually reacted with get a
// persistent pill (see ActivityFooter below); the rest are reachable
// through the "+" picker so eleven options don't clutter every item.
const REACTION_EMOJI = ['❤️', '👏', '😂', '📚', '😍', '🤬', '🤯', '🤮', '🙌', '👀', '💯'];

const ActivityFooter = ({ activity }) => {
  const toast = useToast();
  const { user, isAdmin } = useAuth();
  const [reactions, setReactions] = useState(activity.reactions || []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(null); // null = not fetched yet
  const [commentCount, setCommentCount] = useState(activity.commentCount || 0);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);

  // Hover (desktop) or long-press (touch) on a reaction pill reveals who
  // reacted with it. longPressFired suppresses the click that would
  // otherwise toggle the reaction right after a long-press reveals the list.
  const [tooltipEmoji, setTooltipEmoji] = useState(null);
  const longPressTimer = useRef(null);
  const longPressFired = useRef(false);
  const myName = user?.displayName || user?.username;

  useEffect(() => () => clearTimeout(longPressTimer.current), []);

  const startLongPress = (emoji) => {
    longPressFired.current = false;
    clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setTooltipEmoji(emoji);
      longPressTimer.current = setTimeout(() => setTooltipEmoji(null), 2500);
    }, 450);
  };
  const cancelLongPressTimer = () => clearTimeout(longPressTimer.current);

  const handleReact = (emoji) => {
    setPickerOpen(false);
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      if (!existing) {
        return [...prev, { emoji, count: 1, reactedByMe: true, reactors: myName ? [myName] : [] }];
      }
      const updated = {
        ...existing,
        count: existing.count + (existing.reactedByMe ? -1 : 1),
        reactedByMe: !existing.reactedByMe,
        reactors: existing.reactedByMe
          ? (existing.reactors || []).filter((n) => n !== myName)
          : [...(existing.reactors || []), myName].filter(Boolean),
      };
      return updated.count <= 0 ? prev.filter((r) => r.emoji !== emoji) : prev.map((r) => (r.emoji === emoji ? updated : r));
    });
    activityApi
      .toggleReaction(activity.activityType, activity.activityId, emoji)
      .then((data) => setReactions(data.reactions))
      .catch(() => toast.error('Klarte ikke registrere reaksjonen'));
  };

  const handlePillClick = (emoji) => {
    if (longPressFired.current) {
      longPressFired.current = false;
      setTooltipEmoji(null);
      return;
    }
    handleReact(emoji);
  };

  const toggleComments = () => {
    if (comments !== null) {
      setCommentsOpen((open) => !open);
      return;
    }
    activityApi
      .getComments(activity.activityType, activity.activityId)
      .then((data) => {
        setComments(data.comments || []);
        setCommentsOpen(true);
      })
      .catch(() => toast.error('Klarte ikke hente kommentarer'));
  };

  const submitComment = () => {
    const content = newComment.trim();
    if (!content || posting) return;
    setPosting(true);
    activityApi
      .addComment(activity.activityType, activity.activityId, content)
      .then((data) => {
        setComments((prev) => [...(prev || []), data.comment]);
        setCommentCount((c) => c + 1);
        setNewComment('');
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Klarte ikke legge til kommentar'))
      .finally(() => setPosting(false));
  };

  const handleDeleteComment = (commentId) => {
    activityApi
      .deleteComment(commentId)
      .then(() => {
        setComments((prev) => (prev || []).filter((c) => c._id !== commentId));
        setCommentCount((c) => Math.max(0, c - 1));
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Klarte ikke slette kommentaren'));
  };

  return (
    <div className="mt-2 pl-10 sm:pl-12">
      <div className="flex items-center gap-1.5 flex-wrap">
        {reactions.map((r) => (
          <div key={r.emoji} className="relative">
            <button
              onClick={() => handlePillClick(r.emoji)}
              onMouseEnter={() => setTooltipEmoji(r.emoji)}
              onMouseLeave={() => setTooltipEmoji(null)}
              onTouchStart={() => startLongPress(r.emoji)}
              onTouchEnd={cancelLongPressTimer}
              onTouchMove={cancelLongPressTimer}
              className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
              style={
                r.reactedByMe
                  ? { background: 'var(--color-wine-tint)', border: '1px solid var(--color-primary)' }
                  : { background: 'var(--color-sunken)', border: '1px solid transparent' }
              }
            >
              <span>{r.emoji}</span>
              <span className="font-bold" style={{ color: 'var(--color-text-muted)' }}>{r.count}</span>
            </button>
            {tooltipEmoji === r.emoji && r.reactors?.length > 0 && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap z-10 pointer-events-none"
                style={{ background: 'var(--color-text)', color: 'var(--color-card)' }}
              >
                {r.reactors.join(', ')}
              </div>
            )}
          </div>
        ))}

        <div className="relative">
          <button
            onClick={() => setPickerOpen((open) => !open)}
            onBlur={() => setTimeout(() => setPickerOpen(false), 150)}
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-sunken)', color: 'var(--color-text-faint)' }}
            title="Reager"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <circle cx="8.5" cy="10" r="1" fill="currentColor" stroke="none" />
              <circle cx="15.5" cy="10" r="1" fill="currentColor" stroke="none" />
              <path d="M8 14.5c1 1.2 2.4 1.8 4 1.8s3-.6 4-1.8" />
            </svg>
          </button>
          {pickerOpen && (
            <div
              className="absolute left-0 top-full mt-1 z-10 flex flex-wrap gap-0.5 p-1.5 rounded-xl"
              style={{ width: '9.5rem', background: 'var(--color-card)', border: '1px solid var(--color-border)', boxShadow: '0 10px 24px rgba(0,0,0,0.14)' }}
            >
              {REACTION_EMOJI.map((emoji) => (
                <button
                  key={emoji}
                  onMouseDown={() => handleReact(emoji)}
                  className="text-base w-7 h-7 flex items-center justify-center rounded-lg hover:opacity-70"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={toggleComments}
          className="text-xs font-semibold px-2 py-0.5"
          style={{ color: 'var(--color-text-faint)' }}
        >
          {commentCount > 0 ? `${commentCount} kommentar${commentCount !== 1 ? 'er' : ''}` : 'Kommenter'}
        </button>
      </div>

      {commentsOpen && (
        <div className="mt-2 space-y-2">
          {(comments || []).map((c) => {
            const canDelete = isAdmin || c.user?._id === user?._id;
            return (
              <div key={c._id} className="flex items-start gap-2">
                <AvatarLink user={c.user} className="w-6 h-6 rounded-full text-xs font-bold" />
                <div className="flex-1 min-w-0 text-xs rounded-lg px-2.5 py-1.5 flex items-start gap-2" style={{ background: 'var(--color-sunken)' }}>
                  <div className="flex-1 min-w-0">
                    <NameLink user={c.user} className="font-semibold text-xs" />{' '}
                    <span style={{ color: 'var(--color-text-muted)' }}>{c.content}</span>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteComment(c._id)}
                      className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center hover:opacity-70"
                      style={{ color: 'var(--color-text-faint)' }}
                      title="Slett kommentar"
                      aria-label="Slett kommentar"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                        <line x1="5" y1="5" x2="19" y2="19" />
                        <line x1="19" y1="5" x2="5" y2="19" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitComment();
              }}
              placeholder="Skriv en kommentar ..."
              className="input-field flex-1 text-xs py-1.5"
              disabled={posting}
            />
            <button onClick={submitComment} disabled={posting || !newComment.trim()} className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
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
    <div className="max-w-4xl mx-auto mt-6 sm:mt-10 animate-fadeIn">
      <h2 className="text-lg sm:text-xl font-bold gradient-text mb-3 sm:mb-4">Siste aktivitet</h2>
      <div
        className="rounded-2xl p-3 sm:p-6 space-y-3 sm:space-y-4"
        style={{ background: 'var(--gradient-secondary)' }}
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-[var(--color-wine-tint)] border-t-[var(--color-primary)] rounded-full animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-center text-text-faint py-6">Ingen aktivitet ennå 🌱</p>
        ) : (
          activities.map((activity, i) => (
            <div key={`${activity.activityType}-${activity.activityId}`}>
              <ActivityBody activity={activity} />
              <ActivityFooter activity={activity} />
              {i < activities.length - 1 && (
                <div className="border-b mt-4" style={{ borderColor: "var(--color-border)" }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
