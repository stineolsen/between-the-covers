import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { booksApi } from "../api/booksApi";
import BookGrid from "../components/books/BookGrid";

const SeriesDetail = () => {
  const { seriesName } = useParams();

  const [series, setSeries] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    booksApi
      .getBySeries(seriesName)
      .then((data) => {
        setSeries(data.series);
        setBooks(data.books || []);
      })
      .catch((err) => setError(err.response?.data?.message || "Klarte ikke hente bøker"))
      .finally(() => setLoading(false));
  }, [seriesName]);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-5xl font-bold gradient-text mb-3">📚 {series || "..."}</h1>
          <p className="text-gray-700 text-lg">
            {books.length} {books.length === 1 ? "bok" : "bøker"} i serien, i rekkefølge
          </p>
        </div>

        <BookGrid books={books} loading={loading} error={error} />
      </div>
    </div>
  );
};

export default SeriesDetail;
