import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { meetingsApi } from "../api/meetingsApi";
import { booksApi } from "../api/booksApi";
import { userBooksApi } from "../api/userBooksApi";
import { countReadInYear } from "../utils/readingGoal";
import NextMeeting from "../components/meetings/NextMeeting";
import ActivityFeed from "../components/common/ActivityFeed";
import RecommendationFeed from "../components/common/RecommendationFeed";
import ListNotificationFeed from "../components/common/ListNotificationFeed";
import MyRequestsFeed from "../components/common/MyRequestsFeed";
import ReadingGoalCard from "../components/common/ReadingGoalCard";
import BookCoverFallback from "../components/common/BookCoverFallback";

const Home = () => {
  const { user } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [meetingLoading, setMeetingLoading] = useState(true);
  const [readThisYear, setReadThisYear] = useState(0);
  const [currentlyReading, setCurrentlyReading] = useState([]);

  useEffect(() => {
    meetingsApi
      .getNextMeeting()
      .then((data) => setMeeting(data.meeting || null))
      .catch(() => setMeeting(null))
      .finally(() => setMeetingLoading(false));

    userBooksApi
      .getUserBooks({ status: "read" })
      .then((data) => setReadThisYear(countReadInYear(data.userBooks)))
      .catch(() => {});

    userBooksApi
      .getUserBooks({ status: "currently-reading" })
      .then((data) => setCurrentlyReading((data.userBooks || []).slice(0, 4)))
      .catch(() => {});
  }, []);

  const featuredBook = meeting?.book;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Greeting */}
        <div className="mb-6 animate-fadeIn">
          <p
            className="text-xs font-bold uppercase tracking-wide mb-1"
            style={{ color: "var(--color-text-faint)" }}
          >
            {new Date().toLocaleDateString("nb-NO", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="text-3xl font-semibold mb-1">
            {user
              ? `Hei, ${user.displayName || user.username}`
              : "Velkommen til Between the Covers"}
          </h1>
        </div>

        {/* Bokklubbens bok — always first, including on mobile */}
        {!meetingLoading && featuredBook && (
          <Link
            to={`/books/${featuredBook._id}`}
            className="grid grid-cols-[100px_1fr] sm:grid-cols-[140px_1fr] gap-5 p-5 rounded-2xl mb-6 animate-fadeIn hover:opacity-95 transition-opacity"
            style={{
              background:
                "linear-gradient(135deg, var(--color-wine-tint), var(--color-gold-tint))",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="w-full aspect-[2/3]">
              <BookCoverFallback
                src={
                  featuredBook.coverImage
                    ? booksApi.getCoverUrl(featuredBook.coverImage)
                    : null
                }
                alt={featuredBook.title}
                className="w-full h-full object-cover rounded-lg shadow-md"
              />
            </div>
            <div className="min-w-0">
              <p
                className="text-xs font-bold mb-1"
                style={{ color: "var(--color-primary)" }}
              >
                {meeting.title || "Bokklubbens bok"}
              </p>
              <h2 className="text-2xl font-semibold mb-1">
                {featuredBook.title}
              </h2>
              <p className="mb-2" style={{ color: "var(--color-text-muted)" }}>
                {featuredBook.author}
              </p>
              {featuredBook.description && (
                <p
                  className="font-read text-sm line-clamp-3 max-w-xl"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {featuredBook.description}
                </p>
              )}
            </div>
          </Link>
        )}

        {/* Main grid: activity (main) + meeting/goal/shelf (side) */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          {/* Side column comes first in DOM so it can be ordered first on
              mobile (order-1) while sitting to the right on desktop
              (lg:order-2). */}
          <div className="order-1 lg:order-2">
            <NextMeeting meeting={meeting} />
            <ReadingGoalCard readCount={readThisYear} />
            {currentlyReading.length > 0 && (
              <div className="card p-5 rounded-2xl mb-5">
                <h3
                  className="text-xs font-bold uppercase tracking-wide mb-3"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  Leser nå
                </h3>
                <div className="flex gap-2">
                  {currentlyReading.map((ub) => (
                    <Link
                      key={ub._id}
                      to={`/books/${ub.book?._id}`}
                      className="w-12 aspect-[2/3] flex-shrink-0"
                    >
                      <BookCoverFallback
                        src={
                          ub.book?.coverImage
                            ? booksApi.getCoverUrl(ub.book.coverImage)
                            : null
                        }
                        alt={ub.book?.title}
                        className="w-full h-full object-cover rounded-sm shadow-sm"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="order-2 lg:order-1">
            <ListNotificationFeed />
            <MyRequestsFeed />
            <RecommendationFeed />
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
