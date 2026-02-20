import BookCard from "./BookCard";

const BookGrid = ({ books, loading, error }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Laster inne bøker...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border border-red-200 text-red-700 text-center py-12">
        <p className="text-lg font-semibold mb-2">Greide ikke laste bøker</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="card text-center py-20">
        <div className="text-6xl mb-4">📚</div>
        <p className="text-xl text-gray-700 font-semibold mb-2">
          Ingen bøker funnet
        </p>
        <p className="text-gray-600">Prøv å justere søk eller filtere</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
      {books.map((book) => (
        <BookCard key={book._id} book={book} />
      ))}
    </div>
  );
};

export default BookGrid;
