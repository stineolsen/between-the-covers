const UserBook = require("../models/UserBook");
const Book = require("../models/Book");
const Review = require("../models/Review");
const List = require("../models/List");
const Meeting = require("../models/Meeting");
const User = require("../models/User");
const WrappedResponse = require("../models/WrappedResponse");
const WrappedQuestion = require("../models/WrappedQuestion");

// Computes everything the Bokwrapped results (and the live "year so far"
// card) show, for every member at once - the club is small, and most of the
// personal slides compare a member against everyone else anyway, so one
// pass over the year's data is simpler than per-user queries. Cached
// briefly so a burst of members opening their wrapped on release day
// doesn't recompute it for each of them.

const CACHE_TTL_MS = 2 * 60 * 1000;
const cache = new Map(); // year -> { at, value }

const idOf = (x) => String(x?._id || x);

// Same year boundaries as wrappedController.confirmBooks
function yearRange(year) {
  return {
    start: new Date(`${year}-01-01T00:00:00`),
    end: new Date(`${year + 1}-01-01T00:00:00`),
  };
}

const round1 = (n) => Math.round(n * 10) / 10;
const avg = (nums) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null);

// "Topp X %" only reads well in round numbers
const TOP_BUCKETS = [1, 5, 10, 15, 20, 25, 30, 40, 50];

function percentile(value, allValues) {
  const values = allValues.filter((v) => v > 0);
  if (!value || values.length < 3) return null;
  const rank = 1 + values.filter((v) => v > value).length;
  const share = (rank / values.length) * 100;
  const topPercent = TOP_BUCKETS.find((b) => share <= b) ?? null;
  return { rank, total: values.length, topPercent };
}

function bookSummary(book, extra = {}) {
  return {
    _id: book._id,
    title: book.title,
    author: book.author,
    coverImage: book.coverImage,
    pageCount: book.pageCount || null,
    ...extra,
  };
}

// Builds the per-question award results (shared with the admin tally view)
async function buildAwardTally(year) {
  const [questions, responses] = await Promise.all([
    WrappedQuestion.find({ year }).sort({ order: 1 }),
    WrappedResponse.find({ year })
      .populate("user", "displayName username")
      .populate("answers.bookValue", "title author coverImage"),
  ]);

  const tally = {};
  for (const question of questions) {
    const groups = new Map();

    for (const response of responses) {
      const answer = response.answers.find((a) => a.question.toString() === question._id.toString());
      if (!answer) continue;

      const respondentName = response.user?.displayName || response.user?.username || "Ukjent";
      let groupKey;
      let displayText;
      let book = null;

      if (question.type === "text") {
        if (!answer.textValue) continue;
        groupKey = answer.textValue.toLowerCase().replace(/\s+/g, " ");
        displayText = answer.textValue;
      } else if (question.type === "number") {
        if (answer.numberValue === null || answer.numberValue === undefined) continue;
        groupKey = String(answer.numberValue);
        displayText = String(answer.numberValue);
      } else {
        if (!answer.bookValue) continue;
        groupKey = idOf(answer.bookValue);
        displayText = answer.bookValue.title
          ? `${answer.bookValue.title} — ${answer.bookValue.author}`
          : "Ukjent bok";
        if (answer.bookValue.title) book = bookSummary(answer.bookValue);
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, { text: displayText, book, count: 0, respondents: [] });
      }
      const group = groups.get(groupKey);
      group.count += 1;
      group.respondents.push(respondentName);
    }

    tally[question._id.toString()] = [...groups.values()].sort((a, b) => b.count - a.count);
  }

  const submittedCount = responses.filter((r) => r.stepsCompleted?.awards).length;
  return { questions, tally, responses, submittedCount };
}

// Reading personalities - every member gets two. Each trait has a value per
// member and a minimum bar that keeps the label true. A member's two
// personalities are the traits (among those they clear) where they stand
// out most compared with the rest of the club - the share of other active
// readers they beat. Comparing against the club rather than fixed scores
// keeps one noisy trait (genres are tagged very unevenly) from winning for
// everybody. Ties go to the earlier trait in this list.
const PERSONALITIES = [
  {
    key: "bookworm",
    label: "Lesehesten",
    emoji: "🐎",
    description: "Du leser mer enn de fleste. Bokhylla di vokser i rekordfart.",
    value: (t) => t.count,
    eligible: (t, club) => t.count >= 10 && t.count >= club.medianBooks * 1.5,
  },
  {
    key: "audio",
    label: "Lydbokeleven",
    emoji: "🎧",
    description: "Oppvasken, gåturen, bussen - alt er en anledning til å lese med ørene.",
    value: (t) => t.listeningHours,
    eligible: (t) => t.listeningHours >= 40,
  },
  {
    key: "series",
    label: "Serieslukeren",
    emoji: "🔁",
    description: "Når du først finner en verden du liker, blir du der. Neste bok, takk!",
    value: (t) => t.seriesShare,
    eligible: (t) => t.count >= 5 && t.seriesShare >= 0.6,
  },
  {
    key: "finisher",
    label: "Serieavslutteren",
    emoji: "🏁",
    description: "Du lar ingen tråder henge løst. Starter du en serie, leser du den ut.",
    value: (t) => t.finishedSeries,
    eligible: (t) => t.finishedSeries >= 3,
  },
  {
    key: "murstein",
    label: "Mursteinsspesialisten",
    emoji: "🧱",
    description: "Tynne bøker? Nei takk. Du går for de tykke, og du fullfører dem.",
    value: (t) => t.avgPages,
    eligible: (t) => t.pagesKnown >= 5 && t.avgPages >= 430,
  },
  {
    key: "sprinter",
    label: "Sprinteren",
    emoji: "⚡",
    description: "Korte, gode bøker er din greie. Du får med deg mange historier på kort tid.",
    value: (t) => -t.avgPages,
    eligible: (t) => t.pagesKnown >= 5 && t.avgPages <= 340,
  },
  {
    key: "critic",
    label: "Den kresne kritikeren",
    emoji: "🧐",
    description: "Fem stjerner må fortjenes. Du gir dem ikke bort gratis.",
    value: (t) => (t.avgRating === null ? null : -t.avgRating),
    eligible: (t) => t.ratingCount >= 5 && t.avgRating <= 3.2,
  },
  {
    key: "generous",
    label: "Den rause leseren",
    emoji: "💖",
    description: "Du finner noe å elske i nesten hver bok. Forfatterne burde ha deg som testleser.",
    value: (t) => t.avgRating,
    eligible: (t) => t.ratingCount >= 5 && t.avgRating >= 4,
  },
  {
    key: "reviewer",
    label: "Ordkunstneren",
    emoji: "✍️",
    description: "Du deler tankene dine om bøkene. Vurderingene dine gjør klubben klokere.",
    value: (t) => t.ratingShare,
    eligible: (t) => t.ratingCount >= 8 && t.ratingShare >= 0.35,
  },
  {
    key: "loyal",
    label: "Bokklubbens ryggrad",
    emoji: "🏛️",
    description: "Du leser bokklubbøkene - nesten alle sammen. Klubben hadde ikke vært det samme uten deg.",
    value: (t) => t.bookclubShare,
    eligible: (t) => t.bookclubTotal >= 3 && t.bookclubShare >= 0.85,
  },
  {
    key: "pulse",
    label: "Klubbens puls",
    emoji: "💬",
    description: "Du leser det klubben snakker om, og er alltid med i samtalen.",
    value: (t) => t.sharedShare,
    eligible: (t) => t.count >= 5 && t.sharedShare >= 0.4,
  },
  {
    key: "explorer",
    label: "Oppdageren",
    emoji: "🧭",
    description: "Du leser det ingen andre i klubben har lest. Du er den som finner de skjulte perlene.",
    value: (t) => t.uniqueShare,
    eligible: (t) => t.count >= 5 && t.uniqueShare >= 0.3,
  },
  {
    key: "steady",
    label: "Den stødige",
    emoji: "📅",
    description: "Måned etter måned, uansett årstid. Lesingen din tar aldri pause.",
    value: (t) => t.monthsActive,
    eligible: (t) => t.monthsActive >= 10,
  },
  {
    key: "binge",
    label: "Maratonleseren",
    emoji: "🏃",
    description: "Når lesefeberen tar deg, tar den deg skikkelig. Én måned forsvant helt i bøker.",
    value: (t) => t.bestMonthShare,
    eligible: (t) => t.count >= 10 && t.bestMonthShare >= 0.2,
  },
  {
    key: "fan",
    label: "Forfatterfanen",
    emoji: "⭐",
    description: "Når du finner en forfatter du liker, leser du alt de har skrevet.",
    value: (t) => t.topAuthorBooks,
    eligible: (t) => t.topAuthorBooks >= 4,
  },
  {
    key: "timetraveler",
    label: "Tidsreisende",
    emoji: "🕰️",
    description: "Nye bøker er vel og bra, men du vet at mange perler ble skrevet for lenge siden.",
    value: (t) => t.oldShare,
    eligible: (t) => t.count >= 5 && t.oldShare >= 0.3,
  },
  {
    key: "genre",
    label: "Sjangerhopperen",
    emoji: "🦘",
    description: "Fantasy på mandag, krim på tirsdag, sakprosa på onsdag. Du lar deg ikke sette i bås.",
    // Variety per book, not a raw count - big readers collect genres anyway
    value: (t) => (t.count ? t.distinctGenres / t.count : 0),
    eligible: (t) => t.count >= 5 && t.distinctGenres >= 10 && t.distinctGenres / t.count >= 0.45,
  },
];

const FALLBACK_PERSONALITY = {
  key: "allround",
  label: "Den allsidige leseren",
  emoji: "📚",
  description: "Litt av alt, i ditt eget tempo. Det er akkurat sånn lesing skal være.",
};

// Beating fewer than this share of the other readers isn't "standing out"
const MIN_STANDOUT = 0.5;
// A book counts as "old" (Tidsreisende) when published this long before the year
const OLD_BOOK_YEARS = 20;

const publicPersonality = ({ key, label, emoji, description }) => ({ key, label, emoji, description });

function median(nums) {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Everything the personality rules look at, from a member's year stats
function traitInputs(s, year) {
  const bookCount = s.count || 1;
  return {
    count: s.count,
    avgPages: s.avgPages,
    pagesKnown: s.pagesKnownCount,
    seriesShare: s.series.seriesBooks / bookCount,
    finishedSeries: s.series.finished.length,
    listeningHours: s.listeningHours,
    distinctGenres: s.distinctGenres,
    avgRating: s.avgRating,
    ratingCount: s.ratingCount,
    ratingShare: s.ratingCount / bookCount,
    bookclubShare: s.bookclub.total ? s.bookclub.read / s.bookclub.total : 0,
    bookclubTotal: s.bookclub.total,
    uniqueShare: s.uniqueShare,
    sharedShare: s.books.filter((b) => b.readers >= 3).length / bookCount,
    monthsActive: s.months.filter((m) => m.books > 0).length,
    bestMonthShare: s.bestMonthIndex === null ? 0 : s.months[s.bestMonthIndex].books / bookCount,
    topAuthorBooks: s.topAuthors[0]?.count || 0,
    oldShare: s.books.filter((b) => b.publishedYear && b.publishedYear <= year - OLD_BOOK_YEARS).length / bookCount,
  };
}

// traitsByUser: Map(userId -> traitInputs) for every active reader.
// Returns Map(userId -> [{ personality, score }]) - every trait the member
// clears, strongest first.
function scorePersonalities(traitsByUser) {
  const everyone = [...traitsByUser.values()];
  const club = { medianBooks: median(everyone.map((t) => t.count)) };
  const result = new Map();

  for (const [userId, t] of traitsByUser) {
    const ranked = [];
    for (const p of PERSONALITIES) {
      const mine = p.value(t);
      if (mine === null || !p.eligible(t, club)) continue;
      const others = everyone.filter((o) => o !== t).map((o) => p.value(o)).filter((v) => v !== null);
      // With too few readers to compare against, clearing the bar is enough
      const score = others.length < 2 ? 1 : others.filter((v) => v < mine).length / others.length;
      ranked.push({ personality: p, score });
    }
    // Stable sort keeps list order for ties
    ranked.sort((a, b) => b.score - a.score);
    result.set(userId, ranked);
  }
  return result;
}

// Two personalities per member: their strongest standout first, then the
// next strongest that doesn't give them exactly the same pair as someone
// else (members with the clearest standouts choose first). If they don't
// stand out on two traits, the next traits they still clear; the
// all-rounder is the last resort.
function assignPersonalities(traitsByUser) {
  const scored = [...scorePersonalities(traitsByUser).entries()].sort(
    ([, a], [, b]) => (b[0]?.score ?? -1) - (a[0]?.score ?? -1),
  );
  const usedPairs = new Set();
  const pairKey = (x, y) => [x.key, y.key].sort().join("+");
  const result = new Map();

  for (const [userId, ranked] of scored) {
    const ordered = [
      ...ranked.filter((r) => r.score >= MIN_STANDOUT),
      ...ranked.filter((r) => r.score < MIN_STANDOUT),
    ].map((r) => r.personality);
    const first = ordered[0] || FALLBACK_PERSONALITY;
    const standoutRest = ranked.filter((r) => r.score >= MIN_STANDOUT && r.personality !== first).map((r) => r.personality);
    const second =
      standoutRest.find((p) => !usedPairs.has(pairKey(first, p))) || ordered[1] || FALLBACK_PERSONALITY;

    usedPairs.add(pairKey(first, second));
    // Two all-rounders would read oddly - one is enough
    result.set(userId, first === second ? [first] : [first, second]);
  }
  return result;
}

const PERCENTILE_LABELS = {
  books: "bøker lest",
  pages: "sider lest",
  reviews: "anmeldelser skrevet",
  genres: "ulike sjangre",
  listening: "timer med lydbok",
  audiobooks: "ulike lydbøker",
};

// A book counts as "listened to" this year from 10 minutes on - less is
// usually just sampling a book.
const MIN_LISTEN_SECONDS = 10 * 60;
const hours1 = (seconds) => Math.round((seconds / 3600) * 10) / 10;
// How many times through: listened seconds over the book's length
const timesThrough = (seconds, duration) => (duration > 0 ? Math.round((seconds / duration) * 10) / 10 : null);

function buildListening(absBooks, year, bookByAbsId) {
  const yearKey = String(year);
  const items = absBooks
    .filter((b) => (b.byYear?.[yearKey] || 0) >= MIN_LISTEN_SECONDS)
    .map((b) => {
      const libraryBook = bookByAbsId.get(b.absId);
      const seconds = b.byYear[yearKey];
      return {
        absId: b.absId,
        title: libraryBook?.title || b.title || "Ukjent lydbok",
        author: libraryBook?.author || b.author || "",
        coverImage: libraryBook?.coverImage || null,
        _id: libraryBook?._id || null,
        hours: hours1(seconds),
        durationHours: b.duration ? hours1(b.duration) : null,
        timesThisYear: timesThrough(seconds, b.duration),
        timesAllTime: timesThrough(b.totalSeconds, b.duration),
      };
    })
    .sort((a, b) => b.hours - a.hours);

  if (!items.length) return null;

  const totalHours = items.reduce((sum, b) => sum + b.hours, 0);
  // "On repeat": the book listened through the most times this year - only
  // interesting once it's clearly more than one listen.
  const onRepeat = [...items]
    .filter((b) => b.timesThisYear >= 1.8)
    .sort((a, b) => b.timesThisYear - a.timesThisYear)[0] || null;

  return {
    books: items.length,
    hoursPerBook: Math.round((totalHours / items.length) * 10) / 10,
    top: items.slice(0, 5),
    onRepeat,
  };
}

async function computeYear(year) {
  const { start, end } = yearRange(year);

  const [users, responses, yearReads, dnfs, bookclubBooks, meetings, seriesBooks] = await Promise.all([
    User.find({ status: "approved" })
      .select("displayName username avatar readingGoal absListeningSecondsByYear absListeningBooks")
      .lean(),
    WrappedResponse.find({ year }).lean(),
    UserBook.find({ status: "read", finishedAt: { $gte: start, $lt: end } }).lean(),
    UserBook.find({ status: "dnf", updatedAt: { $gte: start, $lt: end } }).select("user").lean(),
    Book.find({ bookclubMonth: { $regex: String(year) } }).select("title author coverImage").lean(),
    Meeting.find({ date: { $gte: start, $lt: end }, status: { $ne: "cancelled" } }).select("attendees date").lean(),
    Book.find({ series: { $nin: [null, ""] } }).select("series seriesNumber").lean(),
  ]);

  const approvedIds = new Set(users.map((u) => idOf(u)));
  const responseByUser = new Map(responses.map((r) => [idOf(r.user), r]));
  const excludedByUser = new Map(
    responses.map((r) => [idOf(r.user), new Set((r.excludedBookIds || []).map(idOf))]),
  );

  // The year's reads per member, minus anything they unticked in step 1
  const readsByUser = new Map();
  for (const ub of yearReads) {
    const userId = idOf(ub.user);
    if (!approvedIds.has(userId) || !ub.book) continue;
    if (excludedByUser.get(userId)?.has(idOf(ub.book))) continue;
    if (!readsByUser.has(userId)) readsByUser.set(userId, []);
    readsByUser.get(userId).push(ub);
  }

  const yearBookIds = [...new Set([...readsByUser.values()].flat().map((ub) => idOf(ub.book)))];
  const [books, reviews] = await Promise.all([
    Book.find({ _id: { $in: yearBookIds } })
      .select("title author coverImage pageCount genres series seriesNumber bookclubMonth publishedYear")
      .lean(),
    Review.find({ book: { $in: yearBookIds } }).select("book user rating content spoilers likeCount").lean(),
  ]);
  const bookById = new Map(books.map((b) => [idOf(b), b]));

  // Everything below only looks at the year's reads: "userId:bookId" pairs
  const readThisYear = new Set();
  const readersByBook = new Map(); // members who read the book this year - "popularity"
  for (const [userId, reads] of readsByUser) {
    for (const ub of reads) {
      const key = idOf(ub.book);
      if (readThisYear.has(`${userId}:${key}`)) continue;
      readThisYear.add(`${userId}:${key}`);
      readersByBook.set(key, (readersByBook.get(key) || 0) + 1);
    }
  }

  // Reviews of books the reviewer read this year
  const yearReviews = reviews.filter((r) => readThisYear.has(`${idOf(r.user)}:${idOf(r.book)}`));

  // ratingsByBook: bookId -> Map(userId -> rating), only from members who
  // read that book this year
  const ratingsByBook = new Map();
  for (const r of yearReviews) {
    const key = idOf(r.book);
    const userId = idOf(r.user);
    if (!ratingsByBook.has(key)) ratingsByBook.set(key, new Map());
    ratingsByBook.get(key).set(userId, r.rating);
  }

  // First and last book number of each series in the library - a series
  // counts as started/finished when its first/last book was read this year
  const seriesBounds = new Map(); // series -> { first, last, size }
  for (const b of seriesBooks) {
    const bounds = seriesBounds.get(b.series) || { first: null, last: null, size: 0 };
    bounds.size += 1;
    if (b.seriesNumber !== null && b.seriesNumber !== undefined) {
      if (bounds.first === null || b.seriesNumber < bounds.first) bounds.first = b.seriesNumber;
      if (bounds.last === null || b.seriesNumber > bounds.last) bounds.last = b.seriesNumber;
    }
    seriesBounds.set(b.series, bounds);
  }

  // Audiobookshelf items -> library books (for covers on the listening slides)
  const absIds = [...new Set(users.flatMap((u) => (u.absListeningBooks || []).map((b) => b.absId)).filter(Boolean))];
  const absBooks = absIds.length
    ? await Book.find({ absId: { $in: absIds } }).select("title author coverImage pageCount absId").lean()
    : [];
  const bookByAbsId = new Map(absBooks.map((b) => [b.absId, b]));

  const bookclubIds = new Set(bookclubBooks.map(idOf));
  const dnfCountByUser = new Map();
  for (const d of dnfs) dnfCountByUser.set(idOf(d.user), (dnfCountByUser.get(idOf(d.user)) || 0) + 1);

  const reviewCountByUser = new Map();
  for (const r of yearReviews) reviewCountByUser.set(idOf(r.user), (reviewCountByUser.get(idOf(r.user)) || 0) + 1);

  // ---- Club bookclub ranking (Borda count over everyone's ranking lists)
  const rankingListIds = responses.filter((r) => r.stepsCompleted?.ranking && r.rankingListId).map((r) => r.rankingListId);
  const rankingLists = await List.find({ _id: { $in: rankingListIds } }).lean();
  const rankingByUser = new Map();
  const bordaPoints = new Map();
  for (const list of rankingLists) {
    const order = (list.books || []).map((entry) => idOf(entry.book)).filter((id) => bookclubIds.has(id));
    rankingByUser.set(idOf(list.owner), order);
    order.forEach((bookId, index) => {
      bordaPoints.set(bookId, (bordaPoints.get(bookId) || 0) + (order.length - index));
    });
  }
  const bookclubById = new Map(bookclubBooks.map((b) => [idOf(b), b]));
  const clubRanking = [...bordaPoints.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([bookId, points]) => ({ ...bookSummary(bookclubById.get(bookId)), points }));

  // ---- Per-member stats
  const perUser = new Map();
  for (const user of users) {
    const userId = idOf(user);
    const reads = readsByUser.get(userId) || [];

    const myBooks = reads
      .map((ub) => {
        const book = bookById.get(idOf(ub.book));
        if (!book) return null;
        const bookId = idOf(book);
        return {
          ...bookSummary(book),
          genres: book.genres || [],
          series: book.series || null,
          seriesNumber: book.seriesNumber ?? null,
          publishedYear: book.publishedYear || null,
          finishedAt: ub.finishedAt,
          rating: ratingsByBook.get(bookId)?.get(userId) ?? null,
          readers: readersByBook.get(bookId) || 1,
          bookclub: bookclubIds.has(bookId),
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.finishedAt) - new Date(b.finishedAt));

    const withPages = myBooks.filter((b) => b.pageCount);
    const pages = withPages.reduce((sum, b) => sum + b.pageCount, 0);
    const byPages = [...withPages].sort((a, b) => a.pageCount - b.pageCount);
    const byReaders = [...myBooks].sort((a, b) => b.readers - a.readers || a.title.localeCompare(b.title));
    const rated = myBooks.filter((b) => b.rating !== null);
    const byRating = [...rated].sort((a, b) => b.rating - a.rating);

    const months = Array.from({ length: 12 }, () => ({ books: 0, pages: 0 }));
    for (const b of myBooks) {
      const m = new Date(b.finishedAt).getMonth();
      months[m].books += 1;
      months[m].pages += b.pageCount || 0;
    }
    const bestMonthIndex = myBooks.length
      ? months.reduce((best, m, i) => (m.books > months[best].books ? i : best), 0)
      : null;

    const genreCounts = new Map();
    for (const b of myBooks) for (const g of b.genres) genreCounts.set(g, (genreCounts.get(g) || 0) + 1);
    const topGenres = [...genreCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const authorCounts = new Map();
    for (const b of myBooks) authorCounts.set(b.author, (authorCounts.get(b.author) || 0) + 1);
    const topAuthors = [...authorCounts.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    // Series: started = read its first book this year; finished = read its
    // last book (of those in the library) this year
    const seriesThisYear = [...new Set(myBooks.filter((b) => b.series).map((b) => b.series))];
    const readNumbers = (series) => myBooks.filter((b) => b.series === series).map((b) => b.seriesNumber);
    const startedSeries = seriesThisYear.filter((series) => {
      const bounds = seriesBounds.get(series);
      return bounds?.first !== null && bounds?.first !== undefined && readNumbers(series).includes(bounds.first);
    });
    const finishedSeries = seriesThisYear.filter((series) => {
      const bounds = seriesBounds.get(series);
      return bounds?.size >= 2 && bounds.last !== null && readNumbers(series).includes(bounds.last);
    });

    const bookclubRead = myBooks.filter((b) => b.bookclub).length;
    // What the member confirmed in step 3, otherwise their RSVPs
    const response = responseByUser.get(userId);
    const meetingsAttended = response?.attendanceConfirmed
      ? meetings.filter((m) => (response.attendedMeetingIds || []).some((id) => idOf(id) === idOf(m))).length
      : meetings.filter((m) => (m.attendees || []).some((a) => idOf(a) === userId)).length;
    const listeningSeconds = Number(user.absListeningSecondsByYear?.[String(year)] || 0);
    const listening = buildListening(user.absListeningBooks || [], year, bookByAbsId);

    perUser.set(userId, {
      user: { _id: user._id, displayName: user.displayName, username: user.username, avatar: user.avatar },
      books: myBooks,
      count: myBooks.length,
      pages,
      pagesKnownCount: withPages.length,
      avgPages: withPages.length ? Math.round(pages / withPages.length) : 0,
      shortest: byPages[0] || null,
      longest: byPages.length > 1 ? byPages[byPages.length - 1] : null,
      mostPopular: byReaders[0] || null,
      leastPopular: byReaders.length > 1 ? byReaders[byReaders.length - 1] : null,
      avgRating: rated.length ? round1(avg(rated.map((b) => b.rating))) : null,
      ratingCount: rated.length,
      highestRated: byRating[0] || null,
      lowestRated: byRating.length > 1 ? byRating[byRating.length - 1] : null,
      months,
      bestMonthIndex,
      topGenres,
      distinctGenres: genreCounts.size,
      topAuthors,
      series: {
        seriesBooks: myBooks.filter((b) => b.series).length,
        standaloneBooks: myBooks.filter((b) => !b.series).length,
        distinctSeries: seriesThisYear.length,
        started: startedSeries,
        finished: finishedSeries,
      },
      dnfCount: dnfCountByUser.get(userId) || 0,
      reviewCount: reviewCountByUser.get(userId) || 0,
      listeningHours: Math.round(listeningSeconds / 3600),
      listening,
      readingGoal: user.readingGoal || null,
      bookclub: { read: bookclubRead, total: bookclubBooks.length },
      meetings: { attended: meetingsAttended, total: meetings.length },
      uniqueShare: myBooks.length ? myBooks.filter((b) => b.readers === 1).length / myBooks.length : 0,
    });
  }

  // ---- Percentiles, comparisons and personality need everyone's numbers
  const all = [...perUser.values()];
  const metricValues = {
    books: all.map((s) => s.count),
    pages: all.map((s) => s.pages),
    reviews: all.map((s) => s.reviewCount),
    genres: all.map((s) => s.distinctGenres),
    listening: all.map((s) => s.listeningHours),
    audiobooks: all.map((s) => s.listening?.books || 0),
  };
  const activeReaders = all.filter((s) => s.count > 0);
  const allYearRatings = [];
  for (const [bookId, byUser] of ratingsByBook) {
    for (const [userId, rating] of byUser) {
      if (perUser.get(userId)?.books.some((b) => idOf(b) === bookId)) allYearRatings.push(rating);
    }
  }

  const traitsByUser = new Map(); // active readers only - feeds the personality
  for (const [userId, s] of perUser) {
    const percentiles = {};
    for (const metric of Object.keys(metricValues)) {
      const myValue = {
        books: s.count,
        pages: s.pages,
        reviews: s.reviewCount,
        genres: s.distinctGenres,
        listening: s.listeningHours,
        audiobooks: s.listening?.books || 0,
      }[metric];
      const p = percentile(myValue, metricValues[metric]);
      if (p) percentiles[metric] = { ...p, label: PERCENTILE_LABELS[metric], value: myValue };
    }
    // Everyone gets their best "topp X %" - books first if it's a tie
    const bestPercentile =
      Object.entries(percentiles)
        .filter(([, p]) => p.topPercent)
        .sort((a, b) => a[1].topPercent - b[1].topPercent)
        .map(([metric, p]) => ({ metric, ...p }))[0] || null;

    // Most contrarian rating: biggest gap between my rating and everyone else's average
    let contrarian = null;
    for (const book of s.books) {
      if (book.rating === null) continue;
      const others = [...(ratingsByBook.get(idOf(book))?.entries() || [])]
        .filter(([uid]) => uid !== userId)
        .map(([, r]) => r);
      if (others.length < 2) continue;
      const clubAvg = avg(others);
      const diff = book.rating - clubAvg;
      if (Math.abs(diff) >= 1 && (!contrarian || Math.abs(diff) > Math.abs(contrarian.diff))) {
        contrarian = { book: bookSummary(book), myRating: book.rating, clubRating: round1(clubAvg), diff: round1(diff) };
      }
    }

    const myRanking = rankingByUser.get(userId) || null;
    let ranking = null;
    if (myRanking?.length && clubRanking.length) {
      const myTopId = myRanking[0];
      const clubTopId = idOf(clubRanking[0]);
      ranking = {
        myTop: bookSummary(bookclubById.get(myTopId)),
        myTopClubPosition: clubRanking.findIndex((b) => idOf(b) === myTopId) + 1,
        clubTop: bookSummary(bookclubById.get(clubTopId)),
        clubTopMyPosition: myRanking.indexOf(clubTopId) + 1,
      };
    }

    s.percentiles = percentiles;
    s.bestPercentile = bestPercentile;
    s.comparisons = {
      clubAvgBooks: activeReaders.length ? round1(avg(activeReaders.map((r) => r.count))) : null,
      clubAvgRating: allYearRatings.length ? round1(avg(allYearRatings)) : null,
      contrarian,
      ranking,
    };
    if (s.count === 0) {
      s.personalities = [publicPersonality(FALLBACK_PERSONALITY)];
      s.personality = s.personalities[0];
      continue;
    }
    traitsByUser.set(userId, traitInputs(s, year));
  }

  for (const [userId, picks] of assignPersonalities(traitsByUser)) {
    const member = perUser.get(userId);
    member.personalities = picks.map(publicPersonality);
    // The main one - kept for the share cards and summary
    member.personality = member.personalities[0];
  }

  // ---- Club-wide slides
  const yearReadsPerBook = new Map();
  for (const s of all) for (const b of s.books) yearReadsPerBook.set(idOf(b), (yearReadsPerBook.get(idOf(b)) || 0) + 1);
  const [mostReadId, mostReadCount] = [...yearReadsPerBook.entries()].sort((a, b) => b[1] - a[1])[0] || [];

  const topReview = [...yearReviews].filter((r) => r.likeCount > 0).sort((a, b) => b.likeCount - a.likeCount)[0];
  let mostLikedReview = null;
  if (topReview) {
    const reviewBook = bookById.get(idOf(topReview.book)) || (await Book.findById(topReview.book).select("title author coverImage").lean());
    const reviewer = users.find((u) => idOf(u) === idOf(topReview.user));
    if (reviewBook && reviewer) {
      mostLikedReview = {
        reviewer: reviewer.displayName || reviewer.username,
        book: bookSummary(reviewBook),
        rating: topReview.rating,
        likeCount: topReview.likeCount,
        excerpt: topReview.spoilers ? null : (topReview.content || "").slice(0, 220),
      };
    }
  }

  const { questions, tally } = await buildAwardTally(year);
  const awards = questions
    .filter((q) => q.active)
    .map((q) => {
      const groups = tally[q._id.toString()] || [];
      const topCount = groups[0]?.count || 0;
      return {
        label: q.label,
        type: q.type,
        votes: groups.reduce((sum, g) => sum + g.count, 0),
        winners: groups.filter((g) => g.count === topCount && topCount > 0).map(({ text, book, count }) => ({ text, book, count })),
      };
    })
    .filter((a) => a.winners.length > 0);

  const club = {
    readers: activeReaders.length,
    members: users.length,
    books: all.reduce((sum, s) => sum + s.count, 0),
    distinctBooks: yearBookIds.length,
    pages: all.reduce((sum, s) => sum + s.pages, 0),
    listeningHours: all.reduce((sum, s) => sum + s.listeningHours, 0),
    audiobooks: all.reduce((sum, s) => sum + (s.listening?.books || 0), 0),
    reviews: yearReviews.length,
    mostRead: mostReadId ? { ...bookSummary(bookById.get(mostReadId)), readers: mostReadCount } : null,
    ranking: clubRanking.slice(0, 5),
    mostLikedReview,
    awards,
  };

  return { year, perUser, club };
}

// `fresh` skips the cache (and refills it) - for the live views a member
// checks right after correcting dates or ratings
async function getYearStats(year, { fresh = false } = {}) {
  const hit = cache.get(year);
  if (!fresh && hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;
  const value = await computeYear(year);
  cache.set(year, { at: Date.now(), value });
  return value;
}

// The subset that's fine to show all year round - no personality, ranks,
// comparisons or awards, so release day still has something to reveal.
function liveSubset(s) {
  return {
    count: s.count,
    pages: s.pages,
    pagesKnownCount: s.pagesKnownCount,
    books: s.books.map(({ _id, title, author, coverImage, finishedAt }) => ({ _id, title, author, coverImage, finishedAt })),
    shortest: s.shortest,
    longest: s.longest,
    mostPopular: s.mostPopular,
    leastPopular: s.leastPopular,
    avgRating: s.avgRating,
    ratingCount: s.ratingCount,
    bookclub: s.bookclub,
    months: s.months,
    bestMonthIndex: s.bestMonthIndex,
    topGenres: s.topGenres,
    series: s.series,
    readingGoal: s.readingGoal,
  };
}

module.exports = { getYearStats, liveSubset, buildAwardTally, traitInputs, scorePersonalities };
