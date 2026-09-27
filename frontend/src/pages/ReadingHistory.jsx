import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { userBooksApi } from "../api/userBooksApi";
import { booksApi } from "../api/booksApi";
import BookCoverFallback from "../components/common/BookCoverFallback";
import ReadingGoalCard from "../components/common/ReadingGoalCard";
import { countReadInYear } from "../utils/readingGoal";

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
        className="w-28 border rounded px-2 py-0.5 text-sm focus:outline-none"
        style={{ borderColor: error ? "var(--color-terracotta)" : "var(--color-border-strong)" }}
        autoFocus
      />
      <button
        onClick={handleSave}
        className="font-bold text-lg leading-none"
        style={{ color: "var(--color-sage)" }}
        title="Lagre"
      >
        ✓
      </button>
      <button
        onClick={onCancel}
        className="font-bold text-lg leading-none"
        style={{ color: "var(--color-text-faint)" }}
        title="Avbryt"
      >
        ✕
      </button>
    </div>
  );
};

const BookCard = ({ userBook, badge, badgeColor, footer }) => {
  const book = userBook.book;
  if (!book) return null;
  const coverUrl = book.coverImage ? booksApi.getCoverUrl(book.coverImage) : null;

  return (
    <div className="container-gradient group transform transition-all hover:scale-105 px-5 py-5">
      <Link to={`/books/${book._id}`} className="block">
        <div className="relative mb-4 aspect-[2/3] overflow-hidden rounded-2xl">
          <BookCoverFallback
            src={coverUrl}
            alt={book.title}
            className="w-full h-full object-cover transform transition-transform group-hover:scale-110"
          />
          <div
            className="absolute top-2 right-2 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
            style={{ background: badgeColor }}
          >
            {badge}
          </div>
        </div>
        <h3 className="text-lg font-bold gradient-text mb-1 line-clamp-2 group-hover:underline">
          {book.title}
        </h3>
        <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>{book.author}</p>
      </Link>
      {footer}
      {book.averageRating > 0 && (
        <div className="flex items-center gap-2 text-sm mt-1">
          <div className="flex" style={{ color: "var(--color-secondary)" }}>
            {"★".repeat(Math.round(book.averageRating))}
            {"☆".repeat(5 - Math.round(book.averageRating))}
          </div>
          <span style={{ color: "var(--color-text-muted)" }}>{book.averageRating.toFixed(1)}</span>
        </div>
      )}
      {userBook.notes && (
        <div className="mt-3 p-3 rounded-xl" style={{ background: "var(--color-sunken)" }}>
          <p className="text-xs italic line-clamp-2" style={{ color: "var(--color-text-muted)" }}>"{userBook.notes}"</p>
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
  const [dnfBooks, setDnfBooks] = useState([]);
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
      const [readData, currentData, toReadData, dnfData, statsData] = await Promise.all([
        userBooksApi.getUserBooks({ status: "read" }),
        userBooksApi.getUserBooks({ status: "currently-reading" }),
        userBooksApi.getUserBooks({ status: "to-read" }),
        userBooksApi.getUserBooks({ status: "dnf" }),
        userBooksApi.getReadingStats(),
      ]);
      setReadBooks(readData.userBooks || []);
      setCurrentlyReading(currentData.userBooks || []);
      setToRead(toReadData.userBooks || []);
      setDnfBooks(dnfData.userBooks || []);
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

  const pillStyle = (active) =>
    active
      ? { background: "var(--color-primary)", color: "white", border: "1.5px solid var(--color-primary)" }
      : { background: "var(--color-card)", color: "var(--color-primary)", border: "1.5px solid var(--color-primary)" };
  const pillClass = "px-4 py-2 rounded-full font-semibold text-sm transition-all";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div
            className="animate-spin rounded-full h-16 w-16 mx-auto mb-4"
            style={{ border: "4px solid var(--color-wine-tint)", borderTopColor: "var(--color-primary)" }}
          />
          <p className="text-lg font-bold" style={{ color: "var(--color-text-muted)" }}>Laster lesehistorikk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 animate-fadeIn">
          <h1 className="text-3xl font-semibold mb-1">Din lesehistorie</h1>
          <p style={{ color: "var(--color-text-muted)" }}>
            Bøker du har lest, lytter til nå, eller vil komme tilbake til.
          </p>
        </div>

        <div className="max-w-xs mb-6">
          <ReadingGoalCard readCount={countReadInYear(readBooks)} />
        </div>

        {/* Stat tiles — clickable to switch tab */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-fadeIn">
            {[
              { tab: "read", label: "Lest", value: stats.read || 0, color: "var(--color-sage)" },
              { tab: "currently-reading", label: "Leser nå", value: stats["currently-reading"] || 0, color: "var(--color-secondary)" },
              { tab: "to-read", label: "TBR", value: stats["to-read"] || 0, color: "var(--color-blue)" },
              { tab: "dnf", label: "DNF", value: stats.dnf || 0, color: "var(--color-terracotta)" },
            ].map((tile) => (
              <button
                key={tile.tab}
                onClick={() => setActiveTab(tile.tab)}
                className="card text-left p-4"
                style={{
                  borderBottom: `3px solid ${activeTab === tile.tab ? tile.color : "transparent"}`,
                }}
              >
                <div
                  className="font-semibold"
                  style={{ fontFamily: "'Fraunces', serif", fontSize: "1.9rem", lineHeight: 1, color: tile.color }}
                >
                  {tile.value}
                </div>
                <div className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{tile.label}</div>
              </button>
            ))}
          </div>
        )}

        {/* Tab buttons */}
        <div className="flex flex-wrap gap-2 mb-6 animate-fadeIn">
          <button onClick={() => setActiveTab("read")} className={pillClass} style={pillStyle(activeTab === "read")}>Lest</button>
          <button onClick={() => setActiveTab("currently-reading")} className={pillClass} style={pillStyle(activeTab === "currently-reading")}>Leser nå</button>
          <button onClick={() => setActiveTab("to-read")} className={pillClass} style={pillStyle(activeTab === "to-read")}>TBR</button>
          <button onClick={() => setActiveTab("dnf")} className={pillClass} style={pillStyle(activeTab === "dnf")}>DNF</button>
        </div>

        {/* Date error */}
        {dateError && (
          <div
            className="mb-4 p-3 rounded-xl text-center font-bold animate-fadeIn"
            style={{ background: "var(--color-terracotta)", color: "white" }}
          >
            {dateError}
          </div>
        )}

        {/* READ TAB — year filter + timeline */}
        {activeTab === "read" && (
          <>
            <div className="flex gap-2 mb-8 animate-fadeIn flex-wrap">
              {[
                { value: "all", label: "All tid" },
                { value: "this-year", label: String(new Date().getFullYear()) },
                { value: "last-year", label: String(new Date().getFullYear() - 1) },
                { value: "before", label: `Før ${new Date().getFullYear() - 1}` },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setYearFilter(value)}
                  className={pillClass}
                  style={pillStyle(yearFilter === value)}
                >
                  {label}
                </button>
              ))}
            </div>

            {filteredBooks.length === 0 ? (
              <div className="container-gradient text-center py-20 animate-fadeIn">
                <div className="text-6xl mb-4">📚</div>
                <h2 className="text-3xl font-bold gradient-text mb-3">Ingen bøker lest enda</h2>
                <p className="text-lg mb-6" style={{ color: "var(--color-text-muted)" }}>
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
                        style={{ background: "var(--color-primary)" }}
                      >
                        {year}
                      </div>
                      <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
                      <div
                        className="font-bold text-sm px-4 py-2 rounded-full"
                        style={{ background: "var(--color-sunken)", color: "var(--color-text-muted)" }}
                      >
                        {booksByYear[year].length} {booksByYear[year].length === 1 ? "bok" : "bøker"}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {booksByYear[year].map((userBook) => (
                        <BookCard
                          key={userBook._id}
                          userBook={userBook}
                          badge="✓ Lest"
                          badgeColor="var(--color-sage)"
                          footer={
                            <div className="flex items-center gap-2 text-sm mb-2" style={{ color: "var(--color-text-muted)" }}>
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
                                    className="transition-colors"
                                    style={{ color: "var(--color-text-faint)" }}
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
                style={{ background: "linear-gradient(135deg, var(--color-wine-tint), var(--color-gold-tint))" }}
              >
                <h3 className="text-2xl font-bold gradient-text mb-3">🎉 Fortsett lesing!</h3>
                <p className="max-w-3xl mx-auto leading-relaxed text-lg" style={{ color: "var(--color-text-muted)" }}>
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
                <p className="text-lg mb-6" style={{ color: "var(--color-text-muted)" }}>Finn en bok og start lesingen!</p>
                <Link to="/books" className="btn-primary inline-block">Sjekk ut bøkene</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fadeIn">
                {currentlyReading.map((userBook) => (
                  <BookCard
                    key={userBook._id}
                    userBook={userBook}
                    badge="📖 Leser"
                    badgeColor="var(--color-secondary)"
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
                <p className="text-lg mb-6" style={{ color: "var(--color-text-muted)" }}>Legg til bøker du vil lese!</p>
                <Link to="/books" className="btn-primary inline-block">Sjekk ut bøkene</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fadeIn">
                {toRead.map((userBook) => (
                  <BookCard
                    key={userBook._id}
                    userBook={userBook}
                    badge="📚 TBR"
                    badgeColor="var(--color-blue)"
                    footer={null}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* DNF TAB */}
        {activeTab === "dnf" && (
          <>
            {dnfBooks.length === 0 ? (
              <div className="container-gradient text-center py-20 animate-fadeIn">
                <div className="text-6xl mb-4">🚫</div>
                <h2 className="text-3xl font-bold gradient-text mb-3">Ingen DNF-bøker</h2>
                <p className="text-lg mb-6" style={{ color: "var(--color-text-muted)" }}>Bøker du gir opp underveis havner her.</p>
                <Link to="/books" className="btn-primary inline-block">Sjekk ut bøkene</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fadeIn">
                {dnfBooks.map((userBook) => (
                  <BookCard
                    key={userBook._id}
                    userBook={userBook}
                    badge="🚫 DNF"
                    badgeColor="var(--color-terracotta)"
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
