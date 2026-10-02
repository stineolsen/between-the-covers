import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { meetingsApi } from "../../api/meetingsApi";
import { booksApi } from "../../api/booksApi";
import { useAuth } from "../../contexts/useAuth";

// How many upcoming meetings to show in the swipeable carousel.
const MAX_MEETINGS = 5;
// Minimum horizontal drag (px) before a gesture counts as a swipe rather
// than a tap, so a swipe doesn't also trigger the book link / RSVP button.
const DRAG_THRESHOLD = 8;

// Swipeable "next meetings" card for the Home sidebar. Accepts an optional
// `meetings` prop (Home.jsx already fetches the list for the "Bokklubbens
// bok" hero) and only fetches its own copy when one isn't supplied. Lets the
// member swipe through the next few meetings and RSVP to any of them.
const NextMeeting = ({ meetings: meetingsProp }) => {
  const { user } = useAuth();
  const [fetchedItems, setFetchedItems] = useState(null);
  const [loading, setLoading] = useState(meetingsProp === undefined);
  const [overrides, setOverrides] = useState({});
  const [rsvpingId, setRsvpingId] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const viewportRef = useRef(null);
  const pointer = useRef({ startX: 0, width: 0 });
  const didDragRef = useRef(false);

  useEffect(() => {
    if (meetingsProp !== undefined) return;
    meetingsApi
      .getMeetings({ upcoming: true })
      .then((data) => setFetchedItems(data.meetings || []))
      .catch((error) => {
        console.error("Failed to fetch upcoming meetings:", error);
        setFetchedItems([]);
      })
      .finally(() => setLoading(false));
  }, [meetingsProp]);

  const sourceItems = meetingsProp !== undefined ? meetingsProp : fetchedItems;
  const meetings = (sourceItems || [])
    .map((m) => overrides[m._id] || m)
    .slice(0, MAX_MEETINGS);
  // Clamp without an effect: once meetings shrink, render the last valid
  // slide instead of scheduling a setState from a render-derived effect.
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, meetings.length - 1));

  const goTo = (index) => {
    setActiveIndex(Math.max(0, Math.min(meetings.length - 1, index)));
  };

  const handlePointerDown = (e) => {
    if (meetings.length < 2) return;
    didDragRef.current = false;
    pointer.current = {
      startX: e.clientX,
      width: viewportRef.current?.offsetWidth || 1,
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const delta = e.clientX - pointer.current.startX;
    if (Math.abs(delta) > DRAG_THRESHOLD) didDragRef.current = true;
    setDragPx(delta);
  };

  const endDrag = () => {
    if (!isDragging) return;
    const threshold = pointer.current.width * 0.2;
    if (dragPx < -threshold) goTo(safeActiveIndex + 1);
    else if (dragPx > threshold) goTo(safeActiveIndex - 1);
    setIsDragging(false);
    setDragPx(0);
  };

  const suppressClickAfterDrag = (e) => {
    if (didDragRef.current) e.preventDefault();
  };

  const handleRSVP = async (meetingId) => {
    if (rsvpingId) return;
    try {
      setRsvpingId(meetingId);
      const data = await meetingsApi.rsvpMeeting(meetingId);
      setOverrides((prev) => ({ ...prev, [meetingId]: data.meeting }));
    } catch (error) {
      alert(error.response?.data?.message || "Kunne ikke melde deg på møtet");
    } finally {
      setRsvpingId(null);
    }
  };

  if (loading) {
    return (
      <div className="card p-5 rounded-2xl mb-5">
        <div className="animate-pulse h-24" />
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="card p-5 rounded-2xl mb-5">
        <h3
          className="text-xs font-bold uppercase tracking-wide mb-3"
          style={{ color: "var(--color-text-faint)" }}
        >
          Neste møte
        </h3>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Ingen kommende møter enda.
        </p>
        <Link
          to="/meetings"
          className="text-sm font-semibold mt-2 inline-block"
          style={{ color: "var(--color-primary)" }}
        >
          Se alle møtene →
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-5 rounded-2xl mb-5">
      <h3
        className="text-xs font-bold uppercase tracking-wide mb-3"
        style={{ color: "var(--color-text-faint)" }}
      >
        {meetings.length > 1 ? "Kommende møter" : "Neste møte"}
      </h3>

      <div ref={viewportRef} className="overflow-hidden" style={{ touchAction: "pan-y" }}>
        <div
          className="flex"
          style={{
            width: `${meetings.length * 100}%`,
            transform: `translateX(calc(${(-safeActiveIndex * 100) / meetings.length}% + ${dragPx}px))`,
            transition: isDragging ? "none" : "transform 300ms ease",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {meetings.map((meeting) => {
            const meetingDate = new Date(meeting.date);
            const day = meetingDate.getDate();
            const formattedWhen = meetingDate.toLocaleDateString("nb-NO", {
              weekday: "long",
              day: "numeric",
              month: "long",
            });

            const isAttending = meeting.attendees?.some((attendee) => {
              const attendeeId = attendee._id || attendee;
              return attendeeId?.toString() === user?._id?.toString();
            });
            const attendeeCount =
              meeting.attendeeCount || meeting.attendees?.length || 0;
            const isFull =
              meeting.isFull ||
              (meeting.maxAttendees > 0 && attendeeCount >= meeting.maxAttendees);
            const isRSVPing = rsvpingId === meeting._id;

            return (
              <div
                key={meeting._id}
                style={{ width: `${100 / meetings.length}%` }}
                className="flex-shrink-0 px-0.5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "var(--color-primary-solid)",
                      color: "white",
                      fontFamily: "'Fraunces', serif",
                      fontWeight: 600,
                      fontSize: "1.4rem",
                    }}
                  >
                    {day}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm capitalize truncate">
                      {formattedWhen}, {meeting.time}
                    </p>
                    {meeting.location && (
                      <p
                        className="text-xs truncate"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {meeting.location}
                      </p>
                    )}
                  </div>
                </div>

                {meeting.book && (
                  <Link
                    to={`/books/${meeting.book._id}`}
                    onClickCapture={suppressClickAfterDrag}
                    className="flex items-center gap-2.5 p-2 rounded-lg mb-3 hover:opacity-80 transition-opacity"
                    style={{ background: "var(--color-sunken)" }}
                  >
                    {meeting.book.coverImage && (
                      <img
                        src={booksApi.getCoverUrl(meeting.book.coverImage)}
                        alt={meeting.book.title}
                        className="w-8 aspect-[2/3] object-cover rounded-sm flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p
                        className="text-[0.65rem] font-bold uppercase tracking-wide"
                        style={{ color: "var(--color-text-faint)" }}
                      >
                        Møtets bok
                      </p>
                      <p className="text-sm font-semibold truncate">
                        {meeting.book.title}
                      </p>
                    </div>
                  </Link>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClickCapture={suppressClickAfterDrag}
                    onClick={() => handleRSVP(meeting._id)}
                    disabled={isRSVPing || (!isAttending && isFull)}
                    className="flex-1 btn-primary text-sm py-2 disabled:opacity-50"
                    style={
                      isAttending
                        ? { background: "var(--color-text-faint)" }
                        : undefined
                    }
                  >
                    {isRSVPing
                      ? "…"
                      : isAttending
                        ? "✓ Du deltar"
                        : isFull
                          ? "Fullt"
                          : "Jeg blir med"}
                  </button>
                  <span
                    className="text-xs whitespace-nowrap"
                    style={{ color: "var(--color-text-faint)" }}
                  >
                    {attendeeCount} påmeldt
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {meetings.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <button
            type="button"
            onClick={() => goTo(safeActiveIndex - 1)}
            disabled={safeActiveIndex === 0}
            aria-label="Forrige møte"
            className="text-sm leading-none px-1 disabled:opacity-30"
            style={{ color: "var(--color-text-muted)" }}
          >
            ‹
          </button>
          <div className="flex items-center gap-1.5">
            {meetings.map((meeting, i) => (
              <button
                key={meeting._id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Vis møte ${i + 1}`}
                className="rounded-full transition-all"
                style={{
                  width: i === safeActiveIndex ? "1.1rem" : "0.4rem",
                  height: "0.4rem",
                  background:
                    i === safeActiveIndex
                      ? "var(--color-primary-solid)"
                      : "var(--color-border)",
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(safeActiveIndex + 1)}
            disabled={safeActiveIndex === meetings.length - 1}
            aria-label="Neste møte"
            className="text-sm leading-none px-1 disabled:opacity-30"
            style={{ color: "var(--color-text-muted)" }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};

export default NextMeeting;
