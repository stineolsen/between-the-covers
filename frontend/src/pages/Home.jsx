import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { meetingsApi } from "../api/meetingsApi";
import { booksApi } from "../api/booksApi";
import { userBooksApi } from "../api/userBooksApi";
import announcementsApi from "../api/announcementsApi";
import { countReadInYear } from "../utils/readingGoal";
import { percentOf, planStatus } from "../utils/readingPlan";
import NextMeeting from "../components/meetings/NextMeeting";
import ActivityFeed from "../components/common/ActivityFeed";
import RecommendationFeed from "../components/common/RecommendationFeed";
import MyRequestsFeed from "../components/common/MyRequestsFeed";
import ReadingGoalCard from "../components/common/ReadingGoalCard";
import BookCoverFallback from "../components/common/BookCoverFallback";
import WrappedBanner from "../components/home/WrappedBanner";
import AdventCalendarBanner from "../components/home/AdventCalendarBanner";
import SecretSantaBanner from "../components/home/SecretSantaBanner";
import HomeGhosts from "../components/home/HomeGhosts";
import AnniversaryBanner from "../components/home/AnniversaryBanner";
import AnnouncementCard from "../components/home/AnnouncementCard";
import ClubWrappedRow from "../components/home/ClubWrappedRow";

const Home = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [meetingLoading, setMeetingLoading] = useState(true);
  const [readThisYear, setReadThisYear] = useState(0);
  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    announcementsApi.getActive().then((data) => setAnnouncements(data.announcements || [])).catch(() => {});
  }, []);

  useEffect(() => {
    meetingsApi
      .getMeetings({ upcoming: true })
      .then((data) => setMeetings(data.meetings || []))
      .catch(() => setMeetings([]))
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

  const nextMeeting = meetings[0];
  const featuredBook = nextMeeting?.book;

  return (
    <div className="min-h-screen relative">
      <HomeGhosts />
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

        {announcements.map((a) => (
          <AnnouncementCard key={a._id} announcement={a} />
        ))}

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
                {nextMeeting.title || "Bokklubbens bok"}
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

        <AnniversaryBanner />
        <WrappedBanner />
        <ClubWrappedRow />
        <AdventCalendarBanner />
        <SecretSantaBanner />

        {/* Main grid: activity (main) + meeting/goal/shelf (side) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          {/* Side column comes first in DOM so it can be ordered first on
              mobile (order-1) while sitting to the right on desktop
              (lg:order-2). */}
          <div className="order-1 lg:order-2">
            <NextMeeting meetings={meetings} />
            <ReadingGoalCard readCount={readThisYear} />
            {currentlyReading.length > 0 && (
              <div className="card p-5 rounded-2xl mb-5">
                <div className="flex items-baseline justify-between gap-2 mb-3">
                  <h3
                    className="text-xs font-bold uppercase tracking-wide"
                    style={{ color: "var(--color-text-faint)" }}
                  >
                    Leser nå
                  </h3>
                  <Link
                    to="/leseplaner"
                    className="text-xs font-bold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Leseplaner →
                  </Link>
                </div>
                <ul className="grid gap-3">
                  {currentlyReading.map((ub) => {
                    const total = ub.pageCount || ub.book?.pageCount || null;
                    const page = ub.currentPage || 0;
                    const hasProgress = total && ub.progressUpdatedAt;
                    const pct = percentOf(page, total);
                    const status =
                      total && ub.readingPlan
                        ? planStatus({ total, currentPage: page, plan: ub.readingPlan })
                        : null;
                    return (
                      <li key={ub._id}>
                        <Link
                          to={`/books/${ub.book?._id}`}
                          className="flex gap-3 items-center hover:opacity-80"
                        >
                          <div className="w-10 aspect-[2/3] flex-shrink-0">
                            <BookCoverFallback
                              src={
                                ub.book?.coverImage
                                  ? booksApi.getCoverUrl(ub.book.coverImage)
                                  : null
                              }
                              alt=""
                              className="w-full h-full object-cover rounded-sm shadow-sm"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">
                              {ub.book?.title}
                            </p>
                            {hasProgress ? (
                              <>
                                <div className="flex items-center gap-2 mt-1">
                                  <div
                                    className="h-1.5 rounded-full overflow-hidden flex-1"
                                    style={{ background: "var(--color-sunken)" }}
                                  >
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${pct}%`,
                                        background: "var(--color-primary-solid)",
                                      }}
                                    />
                                  </div>
                                  <span
                                    className="text-xs font-bold tabular-nums"
                                    style={{ color: "var(--color-primary)" }}
                                  >
                                    {pct} %
                                  </span>
                                </div>
                                {status && !status.done && (
                                  <p
                                    className="text-xs mt-0.5 truncate"
                                    style={{
                                      color: status.overdue
                                        ? "var(--color-terracotta)"
                                        : "var(--color-text-muted)",
                                    }}
                                  >
                                    {status.overdue
                                      ? "Fristen er ute"
                                      : `🎯 I dag: til side ${status.todayGoalPage}`}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p
                                className="text-xs mt-0.5"
                                style={{ color: "var(--color-text-faint)" }}
                              >
                                Legg inn hvor langt du har kommet
                              </p>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="order-2 lg:order-1">
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
