import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { userBooksApi } from "../api/userBooksApi";
import { booksApi } from "../api/booksApi";

const toDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

const parseDisplayDate = (str) => {
  const parts = str.trim().split(/[./]/);
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  if (yyyy.length !== 4) return null;
  const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  const d = new Date(iso);
  if (isNaN(d) || d > new Date()) return null;
  return iso;
};

const DateEditor = ({ initialDate, onSave, onCancel }) => {
  const inputRef = useRef(null);
  const [error, setError] = useState(false);

  const handleSave = () => {
    const iso = parseDisplayDate(inputRef.current?.value || "");
    if (!iso) { setError(true); return; }
    onSave(iso);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="text"
        defaultValue={toDisplayDate(initialDate)}
        placeholder="dd.mm.åååå"
        onKeyDown={handleKey}
        onChange={() => setError(false)}
        className={`w-28 border rounded px-2 py-0.5 text-sm focus:outline-none ${
          error ? "border-red-400" : "border-purple-300 focus:border-purple-500"
        }`}
        autoFocus
      />
      <button
        onClick={handleSave}
        className="text-green-500 hover:text-green-700 font-bold text-lg leading-none"
        title="Lagre"
      >
        ✓
      </button>
      <button
        onClick={onCancel}
        className="text-gray-400 hover:text-red-500 font-bold text-lg leading-none"
        title="Avbryt"
      >
        ✕
      </button>
    </div>
  );
};

const PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"%3E%3Crect fill="%23e5e7eb" width="300" height="450"/%3E%3Ctext x="50%25" y="50%25" font-size="24" text-anchor="middle" alignment-baseline="middle" font-family="monospace, sans-serif" fill="%239ca3af"%3ENo Cover%3C/text%3E%3C/svg%3E';

const BookCard = ({ userBook, badge, badgeStyle, footer }) => {
  const book = userBook.book;
  if (!book) return null;
  const coverUrl = book.coverImage ? booksApi.getCoverUrl(book.coverImage) : null;

  return (
    <div className="container-gradient group transform transition-all hover:scale-105 px-5 py-5">
      <Link to={`/books/${book._id}`} className="block">
        <div className="relative mb-4 overflow-hidden rounded-2xl">
          <img
            src={coverUrl || PLACEHOLDER}
            alt={book.title}
            className="w-full h-64 object-cover transform transition-transform group-hover:scale-110"
          />
          <div
            className="absolute top-2 right-2 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
            style={badgeStyle}
          >
            {badge}
          </div>
        </div>
        <h3 className="text-lg font-bold gradient-text mb-1 line-clamp-2 group-hover:underline">
          {book.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3">{book.author}</p>
      </Link>
      {footer}
      {book.averageRating > 0 && (
        <div className="flex items-center gap-2 text-sm mt-1">
          <div className="flex text-yellow-400">
            {"★".repeat(Math.round(book.averageRating))}
            {"☆".repeat(5 - Math.round(book.averageRating))}
          </div>
          <span className="text-gray-600">{book.averageRating.toFixed(1)}</span>
        </div>
      )}
      {userBook.notes && (
        <div className="mt-3 p-3 rounded-xl bg-white/50">
          <p className="text-xs text-gray-700 italic line-clamp-2">"{userBook.notes}"</p>
        </div>
      )}
    </div>
  );
};

const ReadingHistory = () => {
  const [activeTab, setActiveTab] = useState("read");
  const [readBooks, setReadBooks] = useState([]);
  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [toRead, setToRead] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState("all");
  const [editingDateId, setEditingDateId] = useState(null);
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [readData, currentData, toReadData, statsData] = await Promise.all([
        userBooksApi.getUserBooks({ status: "read" }),
        userBooksApi.getUserBooks({ status: "currently-reading" }),
        userBooksApi.getUserBooks({ status: "to-read" }),
        userBooksApi.getReadingStats(),
      ]);
      setReadBooks(readData.userBooks || []);
      setCurrentlyReading(currentData.userBooks || []);
      setToRead(toReadData.userBooks || []);
      setStats(statsData.stats || {});
    } catch (error) {
      console.error("Greide ikke hente lesedata:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = async (userBookId, newDate) => {
    setDateError("");
    try {
      await userBooksApi.updateFinishedDate(userBookId, newDate);
      setReadBooks((prev) =>
        prev.map((ub) => (ub._id === userBookId ? { ...ub, finishedAt: newDate } : ub))
      );
    } catch (err) {
      console.error("Greide ikke oppdatere dato:", err);
      setDateError("Greide ikke lagre dato. Prøv igjen.");
    }
  };

  // Year filter logic (read tab only)
  const getFilteredBooks = () => {
    const currentYear = new Date().getFullYear();
    switch (yearFilter) {
      case "this-year":
        return readBooks.filter((ub) => new Date(ub.finishedAt).getFullYear() === currentYear);
      case "last-year":
        return readBooks.filter((ub) => new Date(ub.finishedAt).getFullYear() === currentYear - 1);
      case "before":
        return readBooks.filter((ub) => new Date(ub.finishedAt).getFullYear() <= currentYear - 2);
      default:
        return readBooks;
    }
  };

  const filteredBooks = getFilteredBooks();
  const booksByYear = filteredBooks.reduce((acc, ub) => {
    if (!ub.finishedAt) return acc;
    const year = new Date(ub.finishedAt).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(ub);
    return acc;
  }, {});
  const years = Object.keys(booksByYear).sort((a, b) => b - a);

  const tabStyle = (tab) =>
    activeTab === tab
      ? { background: "linear-gradient(135deg, #667eea, #764ba2)", color: "white" }
      : {};
  const tabClass = (tab) =>
    `px-6 py-2 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
      activeTab === tab ? "text-white" : "bg-white text-gray-700 hover:shadow-xl"
    }`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div
            className="animate-spin rounded-full h-20 w-20 mx-auto mb-4"
            style={{ border: "4px solid rgba(255,255,255,0.3)", borderTopColor: "white" }}
          />
          <p className="text-white text-xl font-bold drop-shadow-lg">✨ Laster lesehistorikk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="text-5xl font-bold gradient-text mb-3 drop-shadow-lg">📚 Historikk</h1>
          <p className="hidden sm:block text-xl text-gray-600 font-medium max-w-2xl mx-auto">
            Her kan du holde styr på bøker du har lest, både i bokklubben og ellers.
          </p>
        </div>

        {/* Stat cards — clickable to switch tab */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8 animate-fadeIn">
            <button
              onClick={() => setActiveTab("read")}
              className="p-6 rounded-2xl text-white shadow-lg transform transition-all hover:scale-105 text-left"
              style={{
                background: "linear-gradient(135deg, #10b981, #14b8a6)",
                outline: activeTab === "read" ? "3px solid white" : "none",
              }}
            >
              <div className="text-4xl mb-2">✅</div>
              <div className="text-4xl font-bold mb-1">{stats.read || 0}</div>
              <div className="text-lg font-medium">Bøker lest</div>
            </button>

            <button
              onClick={() => setActiveTab("currently-reading")}
              className="p-6 rounded-2xl text-white shadow-lg transform transition-all hover:scale-105 text-left"
              style={{
                background: "linear-gradient(135deg, #f093fb, #f5576c)",
                outline: activeTab === "currently-reading" ? "3px solid white" : "none",
              }}
            >
              <div className="text-4xl mb-2">📖</div>
              <div className="text-4xl font-bold mb-1">{stats["currently-reading"] || 0}</div>
              <div className="text-lg font-medium">Leser nå</div>
            </button>

            <button
              onClick={() => setActiveTab("to-read")}
              className="p-6 rounded-2xl text-white shadow-lg transform transition-all hover:scale-105 text-left"
              style={{
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                outline: activeTab === "to-read" ? "3px solid white" : "none",
              }}
            >
              <div className="text-4xl mb-2">📚</div>
              <div className="text-4xl font-bold mb-1">{stats["to-read"] || 0}</div>
              <div className="text-lg font-medium">TBR</div>
            </button>
          </div>
        )}

        {/* Tab buttons */}
        <div className="flex justify-center gap-4 mb-6 animate-fadeIn">
          <button onClick={() => setActiveTab("read")} className={tabClass("read")} style={tabStyle("read")}>
            ✅ Lest
          </button>
          <button onClick={() => setActiveTab("currently-reading")} className={tabClass("currently-reading")} style={tabStyle("currently-reading")}>
            📖 Leser nå
          </button>
          <button onClick={() => setActiveTab("to-read")} className={tabClass("to-read")} style={tabStyle("to-read")}>
            📚 TBR
          </button>
        </div>

        {/* Date error */}
        {dateError && (
          <div
            className="mb-4 p-3 rounded-xl text-white text-center font-bold animate-fadeIn"
            style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
          >
            {dateError}
          </div>
        )}

        {/* READ TAB — year filter + timeline */}
        {activeTab === "read" && (
          <>
            <div className="flex justify-center gap-3 mb-8 animate-fadeIn flex-wrap">
              {[
                { value: "all", label: "All tid" },
                { value: "this-year", label: String(new Date().getFullYear()) },
                { value: "last-year", label: String(new Date().getFullYear() - 1) },
                { value: "before", label: `Før ${new Date().getFullYear() - 1}` },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setYearFilter(value)}
                  className={tabClass(yearFilter === value ? "read" : "")}
                  style={yearFilter === value ? { background: "linear-gradient(135deg, #667eea, #764ba2)", color: "white" } : {}}
                >
                  {label}
                </button>
              ))}
            </div>

            {filteredBooks.length === 0 ? (
              <div className="container-gradient text-center py-20 animate-fadeIn">
                <div className="text-6xl mb-4">📚</div>
                <h2 className="text-3xl font-bold gradient-text mb-3">Ingen bøker lest enda</h2>
                <p className="text-gray-600 text-lg mb-6">
                  Begynn din leseferd i dag! Marker bøker som lest for å se dem her.
                </p>
                <Link to="/books" className="btn-primary inline-block">Sjekk ut bøkene</Link>
              </div>
            ) : (
              <div className="space-y-12">
                {years.map((year) => (
                  <div key={year} className="animate-fadeIn">
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className="text-white px-6 py-1 rounded-full font-bold text-2xl shadow-lg"
                        style={{ background: "linear-gradient(135deg, #f093fb, #f5576c)" }}
                      >
                        {year}
                      </div>
                      <div className="flex-1 h-1 rounded" style={{ background: "linear-gradient(90deg, #667eea, transparent)" }} />
                      <div className="text-gray-300 font-bold text-lg bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                        {booksByYear[year].length} {booksByYear[year].length === 1 ? "bok" : "bøker"}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {booksByYear[year].map((userBook) => (
                        <BookCard
                          key={userBook._id}
                          userBook={userBook}
                          badge="✓ Lest"
                          badgeStyle={{ background: "linear-gradient(135deg, #10b981, #14b8a6)" }}
                          footer={
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <span>📅</span>
                              {editingDateId === userBook._id ? (
                                <DateEditor
                                  initialDate={userBook.finishedAt}
                                  onSave={(date) => { handleDateChange(userBook._id, date); setEditingDateId(null); }}
                                  onCancel={() => setEditingDateId(null)}
                                />
                              ) : (
                                <>
                                  <span>
                                    {userBook.finishedAt
                                      ? new Date(userBook.finishedAt).toLocaleDateString("nb-NO", { year: "numeric", month: "long", day: "numeric" })
                                      : "–"}
                                  </span>
                                  <button
                                    onClick={() => setEditingDateId(userBook._id)}
                                    className="text-gray-400 hover:text-purple-600 transition-colors"
                                    title="Endre dato"
                                  >
                                    ✏️
                                  </button>
                                </>
                              )}
                            </div>
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {readBooks.length > 0 && (
              <div
                className="mt-12 p-8 rounded-2xl text-center animate-fadeIn"
                style={{ background: "linear-gradient(135deg, rgba(240, 147, 251, 0.1), rgba(245, 87, 108, 0.1))" }}
              >
                <h3 className="text-2xl font-bold gradient-text mb-3">🎉 Fortsett lesing!</h3>
                <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed text-lg">
                  Du har lest {readBooks.length} {readBooks.length === 1 ? "bok" : "bøker"}! Fortsett det gode arbeidet!
                </p>
              </div>
            )}
          </>
        )}

        {/* CURRENTLY READING TAB */}
        {activeTab === "currently-reading" && (
          <>
            {currentlyReading.length === 0 ? (
              <div className="container-gradient text-center py-20 animate-fadeIn">
                <div className="text-6xl mb-4">📖</div>
                <h2 className="text-3xl font-bold gradient-text mb-3">Ingen bøker pågår</h2>
                <p className="text-gray-600 text-lg mb-6">Finn en bok og start lesingen!</p>
                <Link to="/books" className="btn-primary inline-block">Sjekk ut bøkene</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fadeIn">
                {currentlyReading.map((userBook) => (
                  <BookCard
                    key={userBook._id}
                    userBook={userBook}
                    badge="📖 Leser"
                    badgeStyle={{ background: "linear-gradient(135deg, #f093fb, #f5576c)" }}
                    footer={null}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* TBR TAB */}
        {activeTab === "to-read" && (
          <>
            {toRead.length === 0 ? (
              <div className="container-gradient text-center py-20 animate-fadeIn">
                <div className="text-6xl mb-4">📚</div>
                <h2 className="text-3xl font-bold gradient-text mb-3">TBR-listen er tom</h2>
                <p className="text-gray-600 text-lg mb-6">Legg til bøker du vil lese!</p>
                <Link to="/books" className="btn-primary inline-block">Sjekk ut bøkene</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fadeIn">
                {toRead.map((userBook) => (
                  <BookCard
                    key={userBook._id}
                    userBook={userBook}
                    badge="📚 TBR"
                    badgeStyle={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}
                    footer={null}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReadingHistory;
