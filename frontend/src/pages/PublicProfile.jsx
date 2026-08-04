import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { usersApi } from "../api/usersApi";
import { booksApi } from "../api/booksApi";
import { useAuth } from "../contexts/AuthContext";
import UserAvatar from "../components/common/UserAvatar";

const TAG_CONFIG = {
  admin:          { label: 'Admin',          bg: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  'top-leser':    { label: 'Topp leser',      bg: 'linear-gradient(135deg, #667eea, #764ba2)' },
  'top-anmelder': { label: 'Topp anmelder',   bg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
};

const PublicProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Redirect to own profile if viewing self
    if (currentUser && currentUser._id && currentUser._id.toString() === userId) {
      navigate("/profile", { replace: true });
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await usersApi.getPublicProfile(userId);
        setProfile(data);
      } catch (err) {
        setError(err.response?.data?.message || "Greide ikke laste profil");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, currentUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div
            className="animate-spin rounded-full h-20 w-20 mx-auto mb-4"
            style={{
              border: "4px solid rgba(255,255,255,0.3)",
              borderTopColor: "white",
            }}
          />
          <p className="text-white text-xl font-bold drop-shadow-lg">
            Laster profil...
          </p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div
            className="container-gradient text-center py-12 animate-fadeIn"
            style={{ background: "linear-gradient(135deg, #f093fb, #f5576c)" }}
          >
            <p className="text-white text-2xl font-bold mb-6">
              {error || "Profil ikke funnet"}
            </p>
            <Link to="/" className="btn-accent">
              Tilbake til forsiden
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { user, tags, bookshelf, favoriteBooks } = profile;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 space-y-6">

        {/* Avatar + name card */}
        <div className="container-gradient flex flex-col items-center text-center pb-8">
          {/* Avatar */}
          <UserAvatar
            user={user}
            className="w-40 h-40 rounded-full overflow-hidden shadow-xl mb-4 text-6xl"
          />

          {/* Name */}
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {user.displayName}
          </h2>
          <p className="text-gray-600 mb-3">@{user.username}</p>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {tags.map((tag) => {
                const config = TAG_CONFIG[tag];
                if (!config) return null;
                return (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-sm font-bold text-white"
                    style={{ background: config.bg }}
                  >
                    {config.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <p className="text-gray-700 leading-relaxed max-w-xl whitespace-pre-line mb-4">
              {user.bio}
            </p>
          )}

          {/* Favorite genres */}
          {user.favoriteGenres && user.favoriteGenres.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {user.favoriteGenres.map((genre, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm font-semibold"
                  style={{ border: "1.5px solid #6B5B95", color: "#6B5B95" }}
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bookshelf */}
        {bookshelf && bookshelf.length > 0 && (
          <div className="container-gradient">
            <h2 className="text-xl font-bold gradient-text mb-4">
              Bokhylle ({bookshelf.length})
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {bookshelf.map(({ book }) => {
                if (!book) return null;
                const cover = booksApi.getCoverUrl(book.coverImage);
                return (
                  <Link
                    key={book._id}
                    to={`/books/${book._id}`}
                    title={`${book.title} — ${book.author}`}
                    className="group block"
                  >
                    <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-md bg-gray-100 group-hover:shadow-xl transition-shadow">
                      {cover ? (
                        <img
                          src={cover}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center p-2"
                          style={{ background: "linear-gradient(135deg, #667eea22, #764ba222)" }}
                        >
                          <span className="text-xs text-center text-gray-500 font-medium line-clamp-3 leading-tight">
                            {book.title}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Favorite books */}
        {favoriteBooks && favoriteBooks.length > 0 && (
          <div className="container-gradient">
            <h2 className="text-xl font-bold gradient-text mb-4">
              Favorittbøker
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {favoriteBooks.map(({ book, rating }, index) => {
                if (!book) return null;
                const cover = booksApi.getCoverUrl(book.coverImage);
                return (
                  <Link
                    key={book._id || index}
                    to={`/books/${book._id}`}
                    title={`${book.title} — ${book.author}`}
                    className="group block"
                  >
                    <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-md bg-gray-100 group-hover:shadow-xl transition-shadow">
                      {cover ? (
                        <img
                          src={cover}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center p-2"
                          style={{ background: "linear-gradient(135deg, #667eea22, #764ba222)" }}
                        >
                          <span className="text-xs text-center text-gray-500 font-medium line-clamp-3 leading-tight">
                            {book.title}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PublicProfile;
