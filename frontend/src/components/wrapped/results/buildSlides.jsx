import { useLayoutEffect, useRef, useState } from "react";
import MonthChart, { MONTHS } from "../MonthChart";
import {
  renderCoverWallCard,
  renderPersonalityCard,
  renderSummaryCard,
  SHARE_THEMES,
} from "../../../utils/wrappedShareImage";
import {
  BigNumber,
  BookFact,
  Center,
  Cover,
  CountUp,
  Headline,
  Kicker,
  Rise,
  THEMES,
  dec,
  genitive,
  nb,
  plural,
} from "./slideParts";
import ShareWithClubSlide from "./ShareWithClubSlide";

const SPINE_COLORS = ["#f2c46d", "#e8799f", "#59c08a", "#4fc1de", "#e8825a", "#f1e6dc", "#c9a0dc"];

// The year's books dropping one by one onto a pile - thickness follows
// page count, scaled so the whole pile fits the slide.
function BookPile({ books, theme }) {
  const pile = books.slice(-40);
  const totalPages = pile.reduce((sum, b) => sum + (b.pageCount || 300), 0) || 1;
  const step = Math.min(0.14, 2.6 / Math.max(1, pile.length));

  return (
    <div className="flex flex-col-reverse items-center w-full mt-6" style={{ height: 300 }} aria-hidden="true">
      {pile.map((book, i) => {
        const thickness = Math.max(5, Math.min(26, ((book.pageCount || 300) / totalPages) * 300));
        const width = 58 + ((book.title.length * 7) % 30);
        const tilt = ((i * 37) % 7) - 3;
        return (
          <div
            key={`${book._id}-${i}`}
            className="rounded-[3px] flex items-center justify-center overflow-hidden wrapped-motion"
            style={{
              width: `${width}%`,
              height: thickness,
              marginTop: 1,
              background: SPINE_COLORS[i % SPINE_COLORS.length],
              color: "#2a1a10",
              boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
              "--tilt": `${tilt * 0.4}deg`,
              animation: `wrappedDrop 0.6s cubic-bezier(.3,.8,.3,1) ${0.3 + i * step}s both`,
            }}
          >
            {thickness >= 14 && <span className="text-[10px] font-semibold truncate px-2">{book.title}</span>}
          </div>
        );
      })}
      <div className="w-[90%] h-2 rounded-full mt-1" style={{ background: theme.fg, opacity: 0.35 }} />
    </div>
  );
}

// Grid shape for a cover wall, by how many books the year has. Every page
// is this full cols x rows rectangle except the last, which holds the rest.
function wallLayout(total) {
  if (total <= 6) return { cols: 3, rows: 2 };
  if (total <= 12) return { cols: 4, rows: 3 };
  if (total <= 20) return { cols: 5, rows: 4 };
  if (total <= 30) return { cols: 6, rows: 5 };
  return { cols: 8, rows: 7 };
}

// One page of the wall: tiles sized so a full cols x rows page fits the box
// in both directions; a short last row is centred.
const WALL_GAP = 6;
function CoverWall({ books, cols, rows }) {
  const boxRef = useRef(null);
  const [tile, setTile] = useState(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return undefined;
    const fit = () => {
      const { width, height } = box.getBoundingClientRect();
      const byWidth = (width - (cols - 1) * WALL_GAP) / cols;
      const byHeight = ((height - (rows - 1) * WALL_GAP) / rows) / 1.5;
      setTile(Math.floor(Math.min(byWidth, byHeight)));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [cols, rows]);

  return (
    <div ref={boxRef} className="h-full mt-4 flex justify-center items-start">
      {tile > 0 && (
        <div
          className="flex flex-wrap justify-center content-start"
          style={{ gap: WALL_GAP, width: cols * tile + (cols - 1) * WALL_GAP }}
        >
          {books.map((book, i) => (
            <Cover
              key={`${book._id}-${i}`}
              book={book}
              className="wrapped-pop shadow-md !rounded-[4px]"
              style={{ width: tile, animationDelay: `${0.2 + i * Math.min(0.05, 1.8 / books.length)}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const Podium = ({ books, theme }) => (
  <div className="flex items-end justify-center gap-3 mt-6">
    {[books[1], books[0], books[2]].map((book, i) => {
      if (!book) return <div key={i} className="w-24" />;
      const place = i === 1 ? 1 : i === 0 ? 2 : 3;
      return (
        <Rise key={book._id} delay={0.3 + (3 - place) * 0.25} className="flex flex-col items-center w-24">
          <Cover book={book} className={place === 1 ? "w-24" : "w-20"} />
          <div
            className="w-full mt-2 rounded-t-lg flex items-start justify-center pt-2 text-2xl font-bold"
            style={{
              height: place === 1 ? 70 : place === 2 ? 50 : 36,
              background: `${theme.fg}26`,
              fontFamily: "'Fraunces', serif",
            }}
          >
            {place}
          </div>
        </Rise>
      );
    })}
  </div>
);

const MAX_SERIES_CHIPS = 36;

const AWARD_THEMES = ["gold", "wine", "sage", "blue", "terracotta", "ink", "blush"];

// canShare: offer the "Del med bokklubben" last slide (released results,
// the member's own, with at least one book). onSharedChange keeps the page's
// copy of data.shared current, so "Se igjen" comes back to the right state.
export function buildSlides({ data, name, canShare = false, onSharedChange }) {
  const { year, personal: p, club } = data;
  const slides = [];
  const add = (slide) => slides.push({ duration: 7000, ...slide, theme: THEMES[slide.theme] });

  // ---------------------------------------------------------------- Intro
  add({
    key: "intro",
    theme: "wine",
    duration: 5000,
    render: () => (
      <Center className="items-center text-center">
        <Rise className="wrapped-pop">
          <img src="/logo_cropped.png" alt="Between the Covers" className="w-44 mx-auto drop-shadow-xl" />
        </Rise>
        <Kicker theme={THEMES.wine} delay={0.3}>
          Bokwrapped {year}
        </Kicker>
        <Headline delay={0.45} className="text-4xl">
          Hei, {name}!
        </Headline>
        <Rise delay={0.7} as="p" className="mt-3 text-lg">
          <span style={{ color: THEMES.wine.muted }}>Klar for å se tilbake på leseåret ditt?</span>
        </Rise>
        <Rise delay={1.2} as="p" className="mt-10 text-sm animate-pulse">
          <span style={{ color: THEMES.wine.muted }}>Trykk for å starte →</span>
        </Rise>
      </Center>
    ),
  });

  if (p && p.count > 0) {
    // ------------------------------------------------------------ Books
    const goal = p.readingGoal;
    add({
      key: "books",
      theme: "gold",
      render: () => (
        <Center>
          <Kicker theme={THEMES.gold}>I {year} leste du</Kicker>
          <BigNumber theme={THEMES.gold}>
            <CountUp value={p.count} />
          </BigNumber>
          <Headline delay={0.4}>{p.count === 1 ? "bok" : "bøker"}</Headline>
          {goal && (
            <Rise delay={1.6} as="p" className="mt-6 text-lg font-semibold">
              {p.count >= goal
                ? `Målet ditt var ${goal}. Du klarte det! 🎉`
                : `Det er ${Math.round((p.count / goal) * 100)} % av målet ditt på ${goal}.`}
            </Rise>
          )}
        </Center>
      ),
    });

    // ------------------------------------------------------------ Pages + book pile
    if (p.pages > 0) {
      const missing = p.count - p.pagesKnownCount;
      add({
        key: "pages",
        theme: "ink",
        duration: 9000,
        render: () => (
          <div className="flex-1 flex flex-col">
            <Kicker theme={THEMES.ink}>Bok for bok ble det</Kicker>
            <BigNumber theme={THEMES.ink}>
              <CountUp value={p.pages} duration={2600} delay={300} />
            </BigNumber>
            <Headline delay={0.4}>sider</Headline>
            <div className="flex-1 flex items-end">
              <BookPile books={p.books} theme={THEMES.ink} />
            </div>
            {missing > 0 && (
              <p className="text-xs mt-2" style={{ color: THEMES.ink.muted }}>
                {plural(missing, "bok", "bøker")} mangler sidetall og er ikke talt med.
              </p>
            )}
          </div>
        ),
      });
    }

    // ------------------------------------------------------------ Month by month
    add({
      key: "months",
      theme: "blush",
      duration: 8000,
      render: () => (
        <Center>
          <Kicker theme={THEMES.blush}>Måned for måned</Kicker>
          <Headline>
            {MONTHS[p.bestMonthIndex][0].toUpperCase() + MONTHS[p.bestMonthIndex].slice(1)} var toppmåneden din
          </Headline>
          <Rise delay={0.3} as="p" className="mt-2 text-lg">
            <span style={{ color: THEMES.blush.muted }}>
              med {plural(p.months[p.bestMonthIndex].books, "bok", "bøker")}
            </span>
          </Rise>
          <Rise delay={0.4} className="mt-10">
            <MonthChart
              months={p.months}
              bestMonthIndex={p.bestMonthIndex}
              height={200}
              barColor={THEMES.blush.accent}
              trackColor={THEMES.blush.muted}
              textColor={THEMES.blush.fg}
              animate
            />
          </Rise>
        </Center>
      ),
    });

    // ------------------------------------------------------------ Shortest / longest
    if (p.shortest && p.longest) {
      add({
        key: "length",
        theme: "sage",
        render: () => (
          <Center>
            <Kicker theme={THEMES.sage}>Fra tynn til tykk</Kicker>
            <Headline>Korteste og lengste bok</Headline>
            <div className="grid grid-cols-2 gap-5 mt-8 items-end">
              {[
                [p.shortest, "Korteste"],
                [p.longest, "Lengste"],
              ].map(([book, label], i) => (
                <Rise key={label} delay={0.3 + i * 0.4} className="flex flex-col items-center text-center">
                  <Cover book={book} className={i === 0 ? "w-24" : "w-36"} />
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider" style={{ color: THEMES.sage.muted }}>
                    {label}
                  </p>
                  <p className="font-semibold leading-snug" style={{ fontFamily: "'Fraunces', serif" }}>
                    {book.title}
                  </p>
                  <p className="text-sm font-bold" style={{ color: THEMES.sage.accent }}>
                    {nb(book.pageCount)} sider
                  </p>
                </Rise>
              ))}
            </div>
          </Center>
        ),
      });
    }

    // ------------------------------------------------------------ Most popular
    if (p.mostPopular && p.mostPopular.readers > 1) {
      add({
        key: "popular",
        theme: "blue",
        render: () => (
          <Center className="items-center text-center">
            <Kicker theme={THEMES.blue}>Du leste det alle snakker om</Kicker>
            <Headline>Din mest populære bok</Headline>
            <BookFact
              book={p.mostPopular}
              theme={THEMES.blue}
              caption={`Lest av ${p.mostPopular.readers} i klubben i år`}
            />
          </Center>
        ),
      });
    }

    // ------------------------------------------------------------ Least popular
    if (p.leastPopular && p.leastPopular._id !== p.mostPopular?._id) {
      const alone = p.leastPopular.readers <= 1;
      add({
        key: "hidden-gem",
        theme: "terracotta",
        render: () => (
          <Center className="items-center text-center">
            <Kicker theme={THEMES.terracotta}>Den skjulte perlen</Kicker>
            <Headline>{alone ? "Ingen andre i klubben leste denne i år" : "Nesten ingen andre leste denne i år"}</Headline>
            <BookFact
              book={p.leastPopular}
              theme={THEMES.terracotta}
              caption={alone ? "Bare du 🤫" : `Bare ${p.leastPopular.readers} i klubben`}
            />
          </Center>
        ),
      });
    }

    // ------------------------------------------------------------ Average rating
    if (p.avgRating !== null) {
      const clubAvg = p.comparisons?.clubAvgRating;
      add({
        key: "rating",
        theme: "wine",
        render: () => (
          <Center>
            <Kicker theme={THEMES.wine}>Snittvurderingen din</Kicker>
            <BigNumber theme={THEMES.wine}>{dec(p.avgRating)}★</BigNumber>
            {clubAvg && (
              <Rise delay={0.6} as="p" className="text-lg">
                Klubbens snitt var {dec(clubAvg)}★ —{" "}
                {p.avgRating > clubAvg ? "du er rausere enn de fleste" : p.avgRating < clubAvg ? "du er strengere enn de fleste" : "helt i takt med klubben"}.
              </Rise>
            )}
            {p.highestRated && (
              <Rise delay={1.1} className="flex items-center gap-4 mt-8 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.12)" }}>
                <Cover book={p.highestRated} className="w-16" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: THEMES.wine.muted }}>
                    Høyest vurdert
                  </p>
                  <p className="font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
                    {p.highestRated.title}
                  </p>
                  <p className="text-sm" style={{ color: THEMES.wine.accent }}>
                    {dec(p.highestRated.rating)}★
                  </p>
                </div>
              </Rise>
            )}
          </Center>
        ),
      });
    }

    // ------------------------------------------------------------ Genres
    if (p.topGenres.length) {
      const max = p.topGenres[0].count;
      add({
        key: "genres",
        theme: "gold",
        render: () => (
          <Center>
            <Kicker theme={THEMES.gold}>Sjangrene dine</Kicker>
            <Headline>{p.topGenres[0].name} toppet lista</Headline>
            <div className="mt-8 space-y-3">
              {p.topGenres.map((g, i) => (
                <Rise key={g.name} delay={0.3 + i * 0.15}>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span>
                      {i + 1}. {g.name}
                    </span>
                    <span>{plural(g.count, "bok", "bøker")}</span>
                  </div>
                  <div className="h-2.5 rounded-full" style={{ background: `${THEMES.gold.fg}22` }}>
                    <div
                      className="h-full rounded-full origin-left wrapped-motion"
                      style={{
                        width: `${(g.count / max) * 100}%`,
                        background: THEMES.gold.accent,
                        animation: `wrappedProgress 0.8s cubic-bezier(.2,.8,.2,1) ${0.4 + i * 0.15}s both`,
                      }}
                    />
                  </div>
                </Rise>
              ))}
            </div>
          </Center>
        ),
      });
    }

    // ------------------------------------------------------------ Series vs standalones
    if (p.series.seriesBooks > 0) {
      const { seriesBooks, standaloneBooks, started, finished } = p.series;
      const share = Math.round((seriesBooks / p.count) * 100);
      add({
        key: "series",
        theme: "sage",
        duration: 8000,
        render: () => (
          <Center>
            <Kicker theme={THEMES.sage}>Serier eller frittstående?</Kicker>
            <Headline>
              {share >= 50 ? `${share} % av bøkene dine var del av en serie` : `${100 - share} % av bøkene dine sto på egne ben`}
            </Headline>
            <Rise delay={0.4} className="mt-6">
              <div className="flex h-10 rounded-full overflow-hidden gap-[2px]">
                <div className="flex items-center pl-4 text-sm font-bold" style={{ width: `${Math.max(share, 12)}%`, background: THEMES.sage.accent, color: "#2a1a10" }}>
                  {seriesBooks}
                </div>
                {standaloneBooks > 0 && (
                  <div className="flex-1 flex items-center justify-end pr-4 text-sm font-bold" style={{ background: `${THEMES.sage.fg}33` }}>
                    {standaloneBooks}
                  </div>
                )}
              </div>
              <div className="flex justify-between text-xs mt-1" style={{ color: THEMES.sage.muted }}>
                <span>I serier</span>
                <span>Frittstående</span>
              </div>
            </Rise>
          </Center>
        ),
      });

      // One slide per list, so every series name gets room
      [
        ["series-started", started, "blue", "Nye serier", (n) => `Du startet ${plural(n, "ny serie", "nye serier")}`],
        ["series-finished", finished, "terracotta", "I mål!", (n) => `Du fullførte ${plural(n, "serie", "serier")}`],
      ].forEach(([key, list, themeKey, kicker, headline]) => {
        if (!list.length) return;
        const theme = THEMES[themeKey];
        const shown = list.slice(0, MAX_SERIES_CHIPS);
        add({
          key,
          theme: themeKey,
          duration: Math.min(12000, 6000 + list.length * 150),
          render: () => (
            <Center>
              <Kicker theme={theme}>{kicker}</Kicker>
              <Headline>{headline(list.length)}</Headline>
              <div className="flex flex-wrap gap-2 mt-6">
                {shown.map((name, i) => (
                  <Rise
                    key={name}
                    delay={0.3 + i * Math.min(0.08, 1.5 / shown.length)}
                    as="span"
                    className={`rounded-full px-3 py-1.5 font-semibold ${list.length > 16 ? "text-xs" : "text-sm"}`}
                    style={{ background: "rgba(255,255,255,0.16)" }}
                  >
                    {name}
                  </Rise>
                ))}
                {list.length > shown.length && (
                  <span className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: theme.fg, color: theme.solid }}>
                    +{list.length - shown.length} til
                  </span>
                )}
              </div>
            </Center>
          ),
        });
      });
    }

    // ------------------------------------------------------------ Audiobooks
    if (p.listening || p.listeningHours > 0) {
      const l = p.listening;
      add({
        key: "listening",
        theme: "blue",
        render: () => (
          <Center>
            <Kicker theme={THEMES.blue}>Med ørene 🎧</Kicker>
            <Headline>Du lyttet til lydbøker i</Headline>
            <BigNumber theme={THEMES.blue}>
              <CountUp value={p.listeningHours} />
            </BigNumber>
            <Headline delay={0.4}>timer</Headline>
            {l && (
              <Rise delay={1.2} as="p" className="mt-6 text-lg">
                fordelt på {plural(l.books, "lydbok", "lydbøker")} — i snitt {dec(l.hoursPerBook)} timer per bok.
              </Rise>
            )}
          </Center>
        ),
      });

      if (l?.top.length > 1) {
        add({
          key: "listening-top",
          theme: "ink",
          duration: 8000,
          render: () => (
            <Center>
              <Kicker theme={THEMES.ink}>Mest lyttet</Kicker>
              <Headline>Lydbøkene du brukte mest tid på</Headline>
              <div className="mt-6 space-y-3">
                {l.top.slice(0, 4).map((b, i) => (
                  <Rise key={b.absId} delay={0.3 + i * 0.2} className="flex items-center gap-3">
                    <span className="w-6 text-xl font-bold" style={{ fontFamily: "'Fraunces', serif", color: THEMES.ink.accent }}>
                      {i + 1}
                    </span>
                    <Cover book={b} className="w-12" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{b.title}</p>
                      <p className="text-xs truncate" style={{ color: THEMES.ink.muted }}>
                        {b.author}
                      </p>
                    </div>
                    <span className="text-sm font-bold whitespace-nowrap">{dec(b.hours)} t</span>
                  </Rise>
                ))}
              </div>
            </Center>
          ),
        });
      }

      if (l?.onRepeat) {
        const r = l.onRepeat;
        add({
          key: "on-repeat",
          theme: "terracotta",
          render: () => (
            <Center className="items-center text-center">
              <Kicker theme={THEMES.terracotta}>På repeat 🔁</Kicker>
              <Headline>Denne kunne du ikke slutte å høre på</Headline>
              <BookFact
                book={r}
                theme={THEMES.terracotta}
                caption={`Lyttet gjennom ${dec(r.timesThisYear)} ganger i år`}
              />
            </Center>
          ),
        });
      }
    }

    // ------------------------------------------------------------ Top X %
    if (p.bestPercentile) {
      const b = p.bestPercentile;
      add({
        key: "top-percent",
        theme: "sage",
        render: () => (
          <Center className="text-center items-center">
            <Kicker theme={THEMES.sage}>Du vs klubben</Kicker>
            <Headline>Du er blant</Headline>
            <BigNumber theme={THEMES.sage}>topp {b.topPercent} %</BigNumber>
            <Headline delay={0.5}>i klubben på {b.label}</Headline>
            <Rise delay={1.1} as="p" className="mt-4 text-lg">
              <span style={{ color: THEMES.sage.muted }}>
                {nb(b.value)} {b.label} — plass {b.rank} av {b.total}
              </span>
            </Rise>
          </Center>
        ),
      });
    }

    // ------------------------------------------------------------ Contrarian
    if (p.comparisons?.contrarian) {
      const c = p.comparisons.contrarian;
      add({
        key: "contrarian",
        theme: "blush",
        render: () => (
          <Center className="items-center text-center">
            <Kicker theme={THEMES.blush}>Din mest kontroversielle mening</Kicker>
            <Headline>{c.diff > 0 ? "Du elsket den. Klubben … ikke så mye." : "Klubben elsket den. Du … ikke så mye."}</Headline>
            <BookFact book={c.book} theme={THEMES.blush} size="w-32" />
            <Rise delay={0.8} className="flex gap-4 mt-5">
              {[
                ["Du", c.myRating],
                ["Klubben", c.clubRating],
              ].map(([who, rating]) => (
                <div key={who} className="rounded-2xl px-5 py-3" style={{ background: "rgba(255,255,255,0.4)" }}>
                  <p className="text-xs font-bold uppercase tracking-wider">{who}</p>
                  <p className="text-3xl font-bold" style={{ fontFamily: "'Fraunces', serif", color: THEMES.blush.accent }}>
                    {dec(rating)}★
                  </p>
                </div>
              ))}
            </Rise>
          </Center>
        ),
      });
    }

    // ------------------------------------------------------------ Ranking vs club
    if (p.comparisons?.ranking) {
      const r = p.comparisons.ranking;
      const same = r.myTop._id === r.clubTop._id;
      add({
        key: "ranking-vs-club",
        theme: "gold",
        duration: 8000,
        render: () => (
          <Center>
            <Kicker theme={THEMES.gold}>Bokklubbøkene</Kicker>
            <Headline>{same ? "Du og klubben var enige om årets beste!" : "Din favoritt vs klubbens favoritt"}</Headline>
            <div className={`grid ${same ? "grid-cols-1" : "grid-cols-2"} gap-5 mt-8`}>
              <Rise delay={0.3} className="flex flex-col items-center text-center">
                <Cover book={r.myTop} className="w-28" />
                <p className="mt-3 text-xs font-bold uppercase tracking-wider" style={{ color: THEMES.gold.muted }}>
                  {same ? "Nummer 1 for alle" : "Din nr. 1"}
                </p>
                <p className="font-semibold leading-snug" style={{ fontFamily: "'Fraunces', serif" }}>
                  {r.myTop.title}
                </p>
                {!same && <p className="text-sm">Klubben: {r.myTopClubPosition}. plass</p>}
              </Rise>
              {!same && (
                <Rise delay={0.7} className="flex flex-col items-center text-center">
                  <Cover book={r.clubTop} className="w-28" />
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider" style={{ color: THEMES.gold.muted }}>
                    Klubbens nr. 1
                  </p>
                  <p className="font-semibold leading-snug" style={{ fontFamily: "'Fraunces', serif" }}>
                    {r.clubTop.title}
                  </p>
                  <p className="text-sm">Du: {r.clubTopMyPosition}. plass</p>
                </Rise>
              )}
            </div>
          </Center>
        ),
      });
    }

    // ------------------------------------------------------------ Bookclub + meetings
    if (p.bookclub.total > 0 || p.meetings.total > 0) {
      add({
        key: "bookclub",
        theme: "wine",
        render: () => (
          <Center>
            <Kicker theme={THEMES.wine}>Bokklubben og deg</Kicker>
            {p.bookclub.total > 0 && (
              <>
                <Headline>Du leste</Headline>
                <BigNumber theme={THEMES.wine}>
                  {p.bookclub.read}/{p.bookclub.total}
                </BigNumber>
                <Headline delay={0.4}>bokklubbøker</Headline>
              </>
            )}
            {p.meetings.total > 0 && (
              <Rise delay={1} as="p" className="mt-6 text-lg">
                og var påmeldt {p.meetings.attended} av {plural(p.meetings.total, "møte", "møter")}.
              </Rise>
            )}
          </Center>
        ),
      });
    }

    // ------------------------------------------------------------ DNF
    if (p.dnfCount > 0) {
      add({
        key: "dnf",
        theme: "ink",
        duration: 6000,
        render: () => (
          <Center>
            <Kicker theme={THEMES.ink}>Og så var det de andre …</Kicker>
            <BigNumber theme={THEMES.ink}>{p.dnfCount}</BigNumber>
            <Headline delay={0.4}>{p.dnfCount === 1 ? "bok fikk ikke æren av å bli lest ferdig" : "bøker fikk ikke æren av å bli lest ferdig"}</Headline>
            <Rise delay={1} as="p" className="mt-5 text-lg">
              <span style={{ color: THEMES.ink.muted }}>Livet er for kort for kjedelige bøker. 🫡</span>
            </Rise>
          </Center>
        ),
      });
    }

    // ------------------------------------------------------------ Cover wall
    // Every cover: full pages of the same grid, the last page takes the rest
    const wall = wallLayout(p.books.length);
    const perPage = wall.cols * wall.rows;
    const wallPages = Math.ceil(p.books.length / perPage);
    for (let page = 0; page < wallPages; page++) {
      const pageBooks = p.books.slice(page * perPage, (page + 1) * perPage);
      add({
        key: `cover-wall-${page}`,
        theme: "wine",
        duration: 9000,
        share: {
          label: "Del bokveggen",
          filename: `bokwrapped-${year}-bokvegg.png`,
          render: () => renderCoverWallCard({ year, personal: p, theme: SHARE_THEMES.gold }),
        },
        render: () => (
          <div className="flex-1 flex flex-col overflow-hidden">
            <Kicker theme={THEMES.wine}>
              Hele året ditt{wallPages > 1 ? ` · del ${page + 1} av ${wallPages}` : ""}
            </Kicker>
            <Headline>
              {page === 0 ? `${year} i ${plural(p.count, "bok", "bøker")}` : "… og enda flere"}
            </Headline>
            <div className="flex-1 min-h-0">
              <CoverWall books={pageBooks} cols={wall.cols} rows={wall.rows} />
            </div>
          </div>
        ),
      });
    }

    // ------------------------------------------------------------ Personality
    add({
      key: "personality",
      theme: "ink",
      duration: 11000,
      share: {
        label: p.personalities.length > 1 ? "Del leserpersonlighetene" : "Del leserpersonligheten",
        filename: `bokwrapped-${year}-personlighet.png`,
        render: () => renderPersonalityCard({ year, name, personalities: p.personalities }),
      },
      render: () => (
        <Center className="items-center text-center">
          <Kicker theme={THEMES.ink}>
            {p.personalities.length > 1 ? "Du er to typer lesere …" : "Leserpersonligheten din er …"}
          </Kicker>
          <div className="w-full space-y-4 mt-4">
            {p.personalities.map((personality, i) => (
              <Rise
                key={personality.key}
                delay={1 + i * 1.4}
                className="rounded-3xl px-5 py-5 wrapped-pop"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <span aria-hidden="true" className="block text-6xl mb-2">
                  {personality.emoji}
                </span>
                <h2 className="text-3xl font-semibold leading-tight">
                  <span style={{ fontFamily: "'Fraunces', serif", color: THEMES.ink.accent }}>{personality.label}</span>
                </h2>
                <p className="mt-2 text-base">
                  <span style={{ color: THEMES.ink.muted }}>{personality.description}</span>
                </p>
              </Rise>
            ))}
          </div>
        </Center>
      ),
    });

    // ------------------------------------------------------------ Summary
    add({
      key: "summary",
      theme: "wine",
      duration: 9000,
      share: {
        label: "Del oppsummeringen",
        filename: `bokwrapped-${year}.png`,
        render: () => renderSummaryCard({ year, name, personal: p }),
      },
      render: () => (
        <Center>
          <Kicker theme={THEMES.wine}>Ditt Bokwrapped {year}</Kicker>
          <Headline>{genitive(name)} leseår</Headline>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {[
              [nb(p.count), p.count === 1 ? "bok" : "bøker"],
              [nb(p.pages), "sider"],
              [p.avgRating !== null ? `${dec(p.avgRating)}★` : "–", "snittvurdering"],
              [p.topGenres[0]?.name || "–", "toppsjanger"],
            ].map(([value, label], i) => (
              <Rise key={label} delay={0.2 + i * 0.12} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.1)" }}>
                <p className="text-2xl font-bold truncate" style={{ fontFamily: "'Fraunces', serif", color: THEMES.wine.accent }}>
                  {value}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: THEMES.wine.muted }}>
                  {label}
                </p>
              </Rise>
            ))}
          </div>
          <Rise delay={0.8} className="mt-4 rounded-2xl p-4 text-center" style={{ background: "rgba(255,255,255,0.1)" }}>
            {p.personalities.map((personality) => (
              <p key={personality.key} className="text-lg font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
                {personality.emoji} {personality.label}
              </p>
            ))}
          </Rise>
          <Rise delay={1} className="flex justify-center gap-2 mt-5">
            {p.books.slice(0, 5).map((b, i) => (
              <Cover key={`${b._id}-${i}`} book={b} className="w-14" />
            ))}
          </Rise>
        </Center>
      ),
    });
  } else {
    add({
      key: "no-books",
      theme: "gold",
      render: () => (
        <Center>
          <Kicker theme={THEMES.gold}>Ditt leseår {year}</Kicker>
          <Headline>Ingen fullførte bøker er registrert på deg i år</Headline>
          <Rise delay={0.5} as="p" className="mt-4 text-lg">
            Kanskje neste år blir ditt år? Marker bøker som lest i appen, så teller de med. Men klubben har lest masse —
            bli med og se! 👉
          </Rise>
        </Center>
      ),
    });
  }

  // ---------------------------------------------------------------- Club
  add({
    key: "club",
    theme: "blue",
    duration: 8000,
    render: () => (
      <Center>
        <Kicker theme={THEMES.blue}>Og nå: klubben 🎉</Kicker>
        <Headline>Sammen leste {club.readers} medlemmer</Headline>
        <BigNumber theme={THEMES.blue}>
          <CountUp value={club.books} />
        </BigNumber>
        <Headline delay={0.4}>bøker</Headline>
        <Rise delay={1.2} as="p" className="mt-6 text-lg">
          Det er {nb(club.pages)} sider
          {club.listeningHours > 0 ? ` og ${nb(club.listeningHours)} timer med lydbok` : ""}.
        </Rise>
      </Center>
    ),
  });

  if (club.mostRead && club.mostRead.readers > 1) {
    add({
      key: "club-most-read",
      theme: "gold",
      render: () => (
        <Center className="items-center text-center">
          <Kicker theme={THEMES.gold}>Årets mest leste bok i klubben</Kicker>
          <BookFact book={club.mostRead} theme={THEMES.gold} size="w-40" caption={`Lest av ${club.mostRead.readers} medlemmer`} />
        </Center>
      ),
    });
  }

  if (club.ranking.length >= 2) {
    add({
      key: "club-ranking",
      theme: "sage",
      duration: 8000,
      render: () => (
        <Center>
          <Kicker theme={THEMES.sage}>Klubbens rangering</Kicker>
          <Headline>Årets beste bokklubbøker</Headline>
          <Podium books={club.ranking} theme={THEMES.sage} />
          <Rise delay={1.3} as="p" className="mt-5 text-center font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
            🏆 {club.ranking[0].title}
          </Rise>
        </Center>
      ),
    });
  }

  if (club.awards.length) {
    add({
      key: "awards-intro",
      theme: "ink",
      duration: 4000,
      render: () => (
        <Center className="items-center text-center">
          <Rise className="wrapped-pop text-7xl mb-4">
            <span aria-hidden="true">🏆</span>
          </Rise>
          <Headline delay={0.3} className="text-4xl">
            BTC Book Awards {year}
          </Headline>
          <Rise delay={0.7} as="p" className="mt-3 text-lg">
            <span style={{ color: THEMES.ink.muted }}>Dere har stemt. Her er vinnerne.</span>
          </Rise>
        </Center>
      ),
    });

    club.awards.forEach((award, i) => {
      const themeKey = AWARD_THEMES[i % AWARD_THEMES.length];
      const theme = THEMES[themeKey];
      const tie = award.winners.length > 1;
      add({
        key: `award-${i}`,
        theme: themeKey,
        render: () => (
          <Center className="items-center text-center">
            <Kicker theme={theme}>🏆 {award.label}</Kicker>
            {tie && <Headline>Delt seier!</Headline>}
            <div className={`flex ${tie ? "gap-4" : ""} justify-center flex-wrap`}>
              {award.winners.slice(0, 3).map((w, j) =>
                w.book ? (
                  <BookFact key={j} book={w.book} theme={theme} size={tie ? "w-24" : "w-36"} delay={0.6 + j * 0.3} />
                ) : (
                  <Rise key={j} delay={0.6 + j * 0.3} className="mt-6 wrapped-pop">
                    <p className="text-3xl font-semibold leading-snug" style={{ fontFamily: "'Fraunces', serif" }}>
                      «{w.text}»
                    </p>
                  </Rise>
                ),
              )}
            </div>
            <Rise delay={1.4} as="p" className="mt-4 text-sm font-semibold">
              <span style={{ color: theme.muted }}>
                {plural(award.winners[0].count, "stemme", "stemmer")} av {award.votes}
              </span>
            </Rise>
          </Center>
        ),
      });
    });
  }

  if (club.mostLikedReview) {
    const r = club.mostLikedReview;
    add({
      key: "club-review",
      theme: "blush",
      duration: 9000,
      render: () => (
        <Center>
          <Kicker theme={THEMES.blush}>Årets mest likte anmeldelse</Kicker>
          <Rise delay={0.2} className="flex gap-4 items-center mt-2">
            <Cover book={r.book} className="w-20" />
            <div>
              <p className="font-semibold text-lg leading-snug" style={{ fontFamily: "'Fraunces', serif" }}>
                {r.book.title}
              </p>
              <p className="text-sm" style={{ color: THEMES.blush.muted }}>
                av {r.reviewer} · {dec(r.rating)}★
              </p>
            </div>
          </Rise>
          {r.excerpt && (
            <Rise delay={0.6} as="blockquote" className="mt-6 text-lg italic leading-relaxed">
              <span style={{ fontFamily: "'Source Serif 4', serif" }}>
                «{r.excerpt}
                {r.excerpt.length >= 220 ? "…" : ""}»
              </span>
            </Rise>
          )}
          <Rise delay={1} as="p" className="mt-4 font-bold">
            ❤️ {plural(r.likeCount, "like", "likes")}
          </Rise>
        </Center>
      ),
    });
  }

  // ---------------------------------------------------------------- Outro
  // With sharing on, the share slide comes last and carries the buttons
  const shareLast = canShare && p && p.count > 0;
  add({
    key: "outro",
    theme: "wine",
    duration: shareLast ? 4000 : 7000,
    render: ({ restart, close }) => (
      <Center className="items-center text-center">
        <Rise className="wrapped-pop text-7xl mb-4">
          <span aria-hidden="true">📚</span>
        </Rise>
        <Headline className="text-4xl">Takk for leseåret!</Headline>
        <Rise delay={0.4} as="p" className="mt-3 text-lg">
          <span style={{ color: THEMES.wine.muted }}>Vi ses mellom permene i {year + 1}.</span>
        </Rise>
        {!shareLast && (
          <Rise delay={0.8} className="flex flex-col gap-3 mt-10 w-full max-w-xs">
            <button
              type="button"
              onClick={restart}
              className="px-6 py-3 rounded-full font-bold"
              style={{ background: THEMES.wine.fg, color: THEMES.wine.solid }}
            >
              ↺ Se igjen
            </button>
            <button
              type="button"
              onClick={close}
              className="px-6 py-3 rounded-full font-bold border-2"
              style={{ borderColor: THEMES.wine.fg, color: THEMES.wine.fg }}
            >
              Tilbake til forsiden
            </button>
          </Rise>
        )}
      </Center>
    ),
  });

  if (shareLast) {
    add({
      key: "share-with-club",
      theme: "wine",
      render: ({ restart, close }) => (
        <ShareWithClubSlide
          year={year}
          personal={p}
          initiallyShared={!!data.shared}
          preview={!data.released}
          onSharedChange={onSharedChange}
          restart={restart}
          close={close}
        />
      ),
    });
  }

  return slides;
}
