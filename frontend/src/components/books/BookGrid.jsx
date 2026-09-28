import BookCard from "./BookCard";
import SeriesGroupCard from "./SeriesGroupCard";
import { groupBySeries } from "../../utils/groupBySeries";

const BookGrid = ({ books, loading, error, userBookMap = {}, onStatusChange, groupSeries = false }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-muted">Laster inne bøker...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12" style={{ background: "var(--color-terracotta-tint)", border: "1px solid var(--color-terracotta)", color: "var(--color-terracotta)" }}>
        <p className="text-lg font-semibold mb-2">Greide ikke laste bøker</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="card text-center py-20">
        <div className="text-6xl mb-4">📚</div>
        <p className="text-xl text-text-muted font-semibold mb-2">
          Ingen bøker funnet
        </p>
        <p className="text-text-muted">Prøv å justere søk eller filtere</p>
      </div>
    );
  }

  const items = groupSeries ? groupBySeries(books) : books.map((book) => ({ type: "book", book }));

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
      {items.map((item) =>
        item.type === "series" ? (
          <SeriesGroupCard
            key={`series-${item.seriesName}`}
            seriesName={item.seriesName}
            books={item.books}
            genres={item.genres}
            userBookMap={userBookMap}
            onStatusChange={onStatusChange}
          />
        ) : (
          <BookCard
            key={item.book._id}
            book={item.book}
            userBookEntry={userBookMap[item.book._id]}
            onStatusChange={onStatusChange}
          />
        ),
      )}
    </div>
  );
};

export default BookGrid;
