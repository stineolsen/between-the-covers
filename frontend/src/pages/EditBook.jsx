import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { booksApi } from "../api/booksApi";
import BookForm from "../components/books/BookForm";

const EditBook = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBook();
  }, [id]);

  const fetchBook = async () => {
    try {
      setLoading(true);
      const data = await booksApi.getBook(id);
      setBook(data.book);
    } catch (err) {
      setError(err.response?.data?.message || "Greide ikke laste bok");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Laster inn bokdata...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="card bg-red-50 border border-red-200 text-center py-12">
            <p className="text-red-700 text-lg mb-4">
              {error || "Book not found"}
            </p>
            <Link to="/books" className="btn-primary">
              Tilbake til bøker
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        <Link
          to={`/books/${id}`}
          className="inline-flex items-center text-gray-600 hover:text-primary mb-6"
        >
          <span className="mr-2 btn-primary">←</span> Tilbake til bøker
        </Link>

        <BookForm bookId={id} initialData={book} />
      </div>
    </div>
  );
};

export default EditBook;
