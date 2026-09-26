import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { meetingsApi } from "../../api/meetingsApi";
import { booksApi } from "../../api/booksApi";
import { useAuth } from "../../contexts/useAuth";

// Compact "next meeting" card for the Home sidebar. Accepts an optional
// `meeting` prop (Home.jsx already fetches it for the "Bokklubbens bok" hero)
// and only fetches its own copy when one isn't supplied.
const NextMeeting = ({ meeting: meetingProp }) => {
  const { user } = useAuth();
  const [fetchedMeeting, setFetchedMeeting] = useState(null);
  const [loading, setLoading] = useState(meetingProp === undefined);
  const [isRSVPing, setIsRSVPing] = useState(false);

  useEffect(() => {
    if (meetingProp !== undefined) return;
    meetingsApi
      .getNextMeeting()
      .then((data) => setFetchedMeeting(data.meeting || null))
      .catch((error) => console.error("Failed to fetch next meeting:", error))
      .finally(() => setLoading(false));
  }, [meetingProp]);

  const meeting = meetingProp !== undefined ? meetingProp : fetchedMeeting;

  const handleRSVP = async () => {
    if (!meeting || isRSVPing) return;
    try {
      setIsRSVPing(true);
      const data = await meetingsApi.rsvpMeeting(meeting._id);
      setFetchedMeeting(data.meeting);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to RSVP");
    } finally {
      setIsRSVPing(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-5 rounded-2xl mb-5">
        <div className="animate-pulse h-24" />
      </div>
    );
  }

  if (!meeting) {
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
  const attendeeCount = meeting.attendeeCount || meeting.attendees?.length || 0;
  const isFull =
    meeting.isFull ||
    (meeting.maxAttendees > 0 && attendeeCount >= meeting.maxAttendees);

  return (
    <div className="card p-5 rounded-2xl mb-5">
      <h3
        className="text-xs font-bold uppercase tracking-wide mb-3"
        style={{ color: "var(--color-text-faint)" }}
      >
        Neste møte
      </h3>

      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: "var(--color-primary)",
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
          onClick={handleRSVP}
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
};

export default NextMeeting;
