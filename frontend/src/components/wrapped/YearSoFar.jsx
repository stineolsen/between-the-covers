import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import wrappedApi from "../../api/wrappedApi";
import { booksApi } from "../../api/booksApi";
import MonthChart, { MONTHS } from "./MonthChart";

const year = new Date().getFullYear();
const nb = (n) => Number(n || 0).toLocaleString("nb-NO");

const Stat = ({ value, label }) => (
  <div className="rounded-2xl p-3 text-center" style={{ background: "var(--color-sunken)" }}>
    <p className="text-2xl font-semibold truncate" style={{ fontFamily: "'Fraunces', serif", color: "var(--color-primary)" }}>
      {value}
    </p>
    <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
      {label}
    </p>
  </div>
);

const MiniBook = ({ label, book, detail }) =>
  book ? (
    <Link to={`/books/${book._id}`} className="flex items-center gap-3 rounded-2xl p-2 hover:opacity-90" style={{ background: "var(--color-sunken)" }}>
      <div className="w-10 aspect-[2/3] rounded-md overflow-hidden flex-shrink-0" style={{ background: "var(--color-wine-tint)" }}>
        {book.coverImage && <img src={booksApi.getCoverUrl(book.coverImage)} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--color-text-faint)" }}>
          {label}
        </p>
        <p className="text-sm font-semibold truncate">{book.title}</p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {detail}
        </p>
      </div>
    </Link>
  ) : null;

// Goodreads-style "your year so far", live all year. The personality,
// rankings, club comparisons and awards are held back for release day.
const YearSoFar = () => {
  const [stats, setStats] = useState(undefined);

  useEffect(() => {
    wrappedApi
      .getLive(year)
      .then((data) => setStats(data.stats))
      .catch(() => setStats(null));
  }, []);

  if (stats === undefined) return null;

  return (
    <div className="container-gradient mt-6">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold gradient-text">📈 Leseåret {year} så langt</h2>
        <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>
          Oppdateres fortløpende
        </span>
      </div>

      {!stats || stats.count === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: "var(--color-text-faint)" }}>
          Ingen fullførte bøker i {year} ennå. Marker en bok som lest, så dukker den opp her.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat value={nb(stats.count)} label={stats.readingGoal ? `av målet på ${stats.readingGoal}` : stats.count === 1 ? "bok" : "bøker"} />
            <Stat value={nb(stats.pages)} label="sider" />
            <Stat value={stats.avgRating !== null ? `${String(stats.avgRating).replace(".", ",")}★` : "–"} label="snittvurdering" />
            <Stat value={stats.topGenres[0]?.name || "–"} label="toppsjanger" />
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold mb-2">
              Bøker per måned
              {stats.bestMonthIndex !== null && (
                <span className="font-normal" style={{ color: "var(--color-text-muted)" }}>
                  {" "}
                  — toppmåned: {MONTHS[stats.bestMonthIndex]}
                </span>
              )}
            </p>
            <MonthChart months={stats.months} bestMonthIndex={stats.bestMonthIndex} height={110} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            <MiniBook label="Korteste" book={stats.shortest} detail={stats.shortest && `${nb(stats.shortest.pageCount)} sider`} />
            <MiniBook label="Lengste" book={stats.longest} detail={stats.longest && `${nb(stats.longest.pageCount)} sider`} />
            <MiniBook
              label="Mest populære"
              book={stats.mostPopular}
              detail={stats.mostPopular && `Lest av ${stats.mostPopular.readers} i klubben i år`}
            />
            <MiniBook
              label="Skjult perle"
              book={stats.leastPopular}
              detail={stats.leastPopular && (stats.leastPopular.readers <= 1 ? "Bare du har lest den i år" : `Lest av ${stats.leastPopular.readers} i klubben i år`)}
            />
          </div>

          {stats.series.seriesBooks > 0 && (
            <p className="text-sm mt-4" style={{ color: "var(--color-text-muted)" }}>
              📚 {stats.series.seriesBooks} i serier, {stats.series.standaloneBooks} frittstående · {stats.series.started.length} nye
              serier startet · {stats.series.finished.length} fullført
            </p>
          )}

          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 mt-6">
            {stats.books.map((book, i) => (
              <Link key={`${book._id}-${i}`} to={`/books/${book._id}`} title={`${book.title} — ${book.author}`}>
                <div className="aspect-[2/3] rounded-md overflow-hidden shadow-sm" style={{ background: "var(--color-wine-tint)" }}>
                  {book.coverImage ? (
                    <img src={booksApi.getCoverUrl(book.coverImage)} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="block p-1 text-[9px] leading-tight" style={{ color: "var(--color-text-faint)" }}>
                      {book.title}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <p className="text-xs mt-4 text-center" style={{ color: "var(--color-text-faint)" }}>
            Leserpersonlighet, klubbsammenligninger og Book Awards kommer i Bokwrapped {year} 🎁
          </p>
        </>
      )}
    </div>
  );
};

export default YearSoFar;
