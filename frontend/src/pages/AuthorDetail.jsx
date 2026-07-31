import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { booksApi } from "../api/booksApi";
import BookGrid from "../components/books/BookGrid";

const AuthorDetail = () => {
  const { authorNormalized } = useParams();

  const [authorName, setAuthorName] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bio, setBio] = useState(null);
  const [bioLoading, setBioLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");
    booksApi
      .getByAuthor(authorNormalized)
      .then((data) => {
        setAuthorName(data.author);
        setBooks(data.books || []);
      })
      .catch((err) => setError(err.response?.data?.message || "Klarte ikke hente bøker"))
      .finally(() => setLoading(false));
  }, [authorNormalized]);

  useEffect(() => {
    if (!authorName) return;

    let cancelled = false;
    setBioLoading(true);
    setBio(null);

    (async () => {
      try {
        const searchRes = await fetch(
          `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(authorName)}&limit=1`,
        );
        const searchData = await searchRes.json();
        const key = searchData.docs?.[0]?.key;
        if (!key) return;

        const authorRes = await fetch(`https://openlibrary.org/authors/${key}.json`);
        const authorData = await authorRes.json();
        if (cancelled) return;

        const bioText = typeof authorData.bio === "string" ? authorData.bio : authorData.bio?.value;
        setBio({
          name: authorData.name,
          bio: bioText || "",
          birthDate: authorData.birth_date || "",
          photoUrl: authorData.photos?.[0]
            ? `https://covers.openlibrary.org/a/id/${authorData.photos[0]}-M.jpg`
            : null,
          link: authorData.links?.[0]?.url || null,
        });
      } catch {
        // Bio is a nice-to-have — silently skip if Open Library has nothing on this author
      } finally {
        if (!cancelled) setBioLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authorName]);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-5xl font-bold gradient-text mb-3">✍️ {authorName || "..."}</h1>
          <p className="text-gray-700 text-lg">
            {books.length} {books.length === 1 ? "bok" : "bøker"} av denne forfatteren
          </p>
        </div>

        {!bioLoading && bio?.bio && (
          <div className="container-gradient mb-8 flex gap-5 items-start animate-fadeIn">
            {bio.photoUrl && (
              <img
                src={bio.photoUrl}
                alt={bio.name}
                className="w-24 h-32 object-cover rounded-xl shadow-md flex-shrink-0"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
            <div className="min-w-0">
              {bio.birthDate && <p className="text-sm text-gray-500 mb-1">Født {bio.birthDate}</p>}
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{bio.bio}</p>
              {bio.link && (
                <a
                  href={bio.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-sm font-semibold text-purple-600 hover:text-purple-800"
                >
                  🔗 Offisiell nettside
                </a>
              )}
              <p className="text-xs text-gray-400 mt-3">Hentet fra Open Library</p>
            </div>
          </div>
        )}

        <BookGrid books={books} loading={loading} error={error} />
      </div>
    </div>
  );
};

export default AuthorDetail;
