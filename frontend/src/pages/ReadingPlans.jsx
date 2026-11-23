import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userBooksApi } from "../api/userBooksApi";
import { booksApi } from "../api/booksApi";
import ReadingProgressCard from "../components/books/ReadingProgressCard";
import BookCoverFallback from "../components/common/BookCoverFallback";

// Every book the member is currently reading, each with its progress and
// reading plan - the same card as on the book page, gathered in one place.
const ReadingPlans = () => {
  const [userBooks, setUserBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    userBooksApi
      .getUserBooks({ status: "currently-reading" })
      .then((data) => setUserBooks(data.userBooks || []))
      .catch((err) => setError(err.response?.data?.message || "Klarte ikke laste bøkene"))
      .finally(() => setLoading(false));
  }, []);

  // Books with a plan first (soonest deadline first), then the rest
  const sorted = [...userBooks].sort((a, b) => {
    const ta = a.readingPlan ? new Date(a.readingPlan.targetDate).getTime() : Infinity;
    const tb = b.readingPlan ? new Date(b.readingPlan.targetDate).getTime() : Infinity;
    return ta - tb;
  });

  const replace = (saved) =>
    setUserBooks((list) => list.map((ub) => (ub._id === saved._id ? { ...saved, book: saved.book || ub.book } : ub)));

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-5xl font-bold gradient-text mb-3">Leseplaner</h1>
          <p className="text-lg" style={{ color: "var(--color-text-muted)" }}>
            Fremdriften og planene for bøkene du leser nå.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[var(--color-wine-tint)] border-t-[var(--color-primary)] rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-center py-16" style={{ color: "var(--color-terracotta)" }}>
            {error}
          </p>
        ) : sorted.length === 0 ? (
          <div className="container-gradient text-center py-20 animate-fadeIn">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-3xl font-bold gradient-text mb-3">Du leser ingen bøker nå</h2>
            <p className="text-lg mb-6" style={{ color: "var(--color-text-muted)" }}>
              Sett en bok til «Leser» for å følge fremdriften og lage en leseplan.
            </p>
            <Link to="/books" className="btn-primary inline-block">
              Finn en bok
            </Link>
          </div>
        ) : (
          sorted.map((ub) => (
            <ReadingProgressCard
              key={ub._id}
              userBook={ub}
              book={ub.book || {}}
              onChange={replace}
              heading={
                <Link to={`/books/${ub.book?._id}`} className="flex items-center gap-3 min-w-0 hover:opacity-80">
                  <div className="w-10 aspect-[2/3] flex-shrink-0">
                    <BookCoverFallback
                      src={ub.book?.coverImage ? booksApi.getCoverUrl(ub.book.coverImage) : null}
                      alt=""
                      className="w-full h-full object-cover rounded-sm shadow-sm"
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 id={`progress-heading-${ub._id}`} className="text-lg font-bold truncate">
                      {ub.book?.title}
                    </h2>
                    <p className="text-sm truncate" style={{ color: "var(--color-text-muted)" }}>
                      {ub.book?.author}
                    </p>
                  </div>
                </Link>
              }
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ReadingPlans;
