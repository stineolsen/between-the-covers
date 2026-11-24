// Maps genres/subjects from Hardcover, Open Library and Nasjonalbiblioteket
// onto the library's own genre list (the genres already used on books), so
// "Detective and mystery stories", "mystery" and "Mystery fiction" all land
// on "Mystery & Detective". Anything that can't be mapped is returned
// separately so the member can be asked before a new genre is created.

// lower-case source term -> one or more of our genres
const SYNONYMS = {
  // Romance
  romance: "Romance",
  "love stories": "Romance",
  "romantic comedy": ["Romance", "Humor"],
  "rom-com": ["Romance", "Humor"],
  romcom: ["Romance", "Humor"],
  "contemporary romance": ["Romance", "Contemporary"],
  "historical romance": ["Romance", "Historical"],
  "fantasy romance": ["Romance", "Fantasy"],
  romantasy: ["Romance", "Fantasy"],
  "paranormal romance": ["Romance", "Fantasy"],
  "sports romance": ["Romance", "Sport"],
  "billionaire romance": ["Romance", "Billionaires"],
  "christmas romance": ["Romance", "Holidays"],
  "holiday romance": ["Romance", "Holidays"],
  "western romance": ["Romance", "Cowboy"],
  "new adult": "Romance",
  "chick lit": "Contemporary",
  romantikk: "Romance",
  kjærlighet: "Romance",

  // Fantasy
  fantasy: "Fantasy",
  "epic fantasy": "Fantasy",
  "high fantasy": "Fantasy",
  "urban fantasy": "Fantasy",
  "dark fantasy": "Fantasy",
  "historical fantasy": ["Fantasy", "Historical"],
  "fairy tales": "Fantasy",
  magic: "Fantasy",
  paranormal: "Fantasy",
  "sword and sorcery": "Fantasy",
  dragons: "Fantasy",
  vampires: "Fantasy",

  // Historical
  historical: "Historical",
  history: "Historical",
  "historical fiction": "Historical",
  historisk: "Historical",
  "historiske romaner": "Historical",

  // Contemporary
  contemporary: "Contemporary",
  "contemporary fiction": "Contemporary",
  "women's fiction": "Contemporary",
  "domestic fiction": "Contemporary",

  // Mystery & Detective
  mystery: "Mystery & Detective",
  mysteries: "Mystery & Detective",
  detective: "Mystery & Detective",
  "detective and mystery stories": "Mystery & Detective",
  "detective and mystery fiction": "Mystery & Detective",
  "mystery and detective stories": "Mystery & Detective",
  "mystery & detective": "Mystery & Detective",
  "mystery and detective": "Mystery & Detective",
  "cozy mystery": "Mystery & Detective",
  "cozy mysteries": "Mystery & Detective",
  "private investigators": "Mystery & Detective",
  whodunit: "Mystery & Detective",

  // Crime
  crime: "Crime",
  "police procedural": "Crime",
  murder: "Crime",
  "true crime": ["Crime", "Non-fiction"],
  krim: "Crime",
  kriminalromaner: "Crime",

  // Literary
  literary: "Literary",
  "literary fiction": "Literary",
  "psychological fiction": "Literary",
  literature: "Literary",

  // Action & Adventure
  adventure: "Action & Adventure",
  action: "Action & Adventure",
  "action & adventure": "Action & Adventure",
  "action and adventure": "Action & Adventure",
  "adventure stories": "Action & Adventure",
  eventyr: "Action & Adventure",

  // Thrillers & Suspense
  thriller: "Thrillers & Suspense",
  thrillers: "Thrillers & Suspense",
  suspense: "Thrillers & Suspense",
  "thrillers & suspense": "Thrillers & Suspense",
  "thrillers and suspense": "Thrillers & Suspense",
  "psychological thriller": "Thrillers & Suspense",
  "psychological thrillers": "Thrillers & Suspense",
  spenning: "Thrillers & Suspense",

  // Sport
  sport: "Sport",
  sports: "Sport",
  hockey: "Sport",
  "ice hockey": "Sport",
  football: "Sport",
  soccer: "Sport",

  // Science Fiction
  "science fiction": "Science Fiction",
  "science-fiction": "Science Fiction",
  "sci-fi": "Science Fiction",
  scifi: "Science Fiction",
  "sci fi": "Science Fiction",
  sf: "Science Fiction",
  "space opera": "Science Fiction",
  "speculative fiction": "Science Fiction",

  // Young Adult
  "young adult": "Young Adult",
  ya: "Young Adult",
  teen: "Young Adult",
  "teen & young adult": "Young Adult",

  // Mythology
  mythology: "Mythology",
  myths: "Mythology",
  "greek mythology": "Mythology",
  "norse mythology": "Mythology",
  retellings: "Mythology",

  // Classics
  classics: "Classics",
  classic: "Classics",
  "classic literature": "Classics",
  klassikere: "Classics",

  // Humor
  humor: "Humor",
  humour: "Humor",
  comedy: "Humor",
  funny: "Humor",
  humorous: "Humor",

  // Dystopian
  dystopian: "Dystopian",
  dystopia: "Dystopian",
  dystopias: "Dystopian",
  "post-apocalyptic": "Dystopian",
  "post apocalyptic": "Dystopian",

  // Billionaires
  billionaire: "Billionaires",
  billionaires: "Billionaires",

  // Holidays
  holiday: "Holidays",
  holidays: "Holidays",
  christmas: "Holidays",
  jul: "Holidays",

  // Non-fiction
  "non-fiction": "Non-fiction",
  nonfiction: "Non-fiction",
  "non fiction": "Non-fiction",
  "self-help": "Non-fiction",
  "self help": "Non-fiction",
  sakprosa: "Non-fiction",

  // Biography & Autobiography
  biography: "Biography & Autobiography",
  autobiography: "Biography & Autobiography",
  "biography & autobiography": "Biography & Autobiography",
  "biography and autobiography": "Biography & Autobiography",
  memoir: "Biography & Autobiography",
  memoirs: "Biography & Autobiography",
  biografi: "Biography & Autobiography",

  // Horror
  horror: "Horror",
  "ghost stories": "Horror",
  gothic: "Horror",
  skrekk: "Horror",

  // Children's fiction
  "children's fiction": "Children's fiction",
  "childrens fiction": "Children's fiction",
  "children's books": "Children's fiction",
  "children's stories": "Children's fiction",
  "juvenile fiction": "Children's fiction",
  "juvenile literature": "Children's fiction",
  "middle grade": "Children's fiction",
  "picture books": "Children's fiction",
  barnebøker: "Children's fiction",
  "barn/ungdom": "Children's fiction",
  barn: "Children's fiction",

  // Cowboy
  cowboy: "Cowboy",
  cowboys: "Cowboy",
  western: "Cowboy",
  westerns: "Cowboy",

  // Dark Academia
  "dark academia": "Dark Academia",
};

// Too general to be a genre - dropped without asking
const IGNORE = new Set([
  "fiction",
  "general",
  "novel",
  "novels",
  "roman",
  "romaner",
  "skjønnlitteratur",
  "english fiction",
  "american fiction",
  "fiction in english",
  "large type books",
  "audiobook",
  "audiobooks",
  "ebook",
  "ebooks",
  "book club",
  "books and reading",
  "adult",
  "adult fiction",
  "translations into english",
]);

// "Russian fiction", "Norwegian literature", "Crime in literature" - Open
// Library subject headings that describe origin or topic, not genre
const NATIONALITIES =
  "american|english|british|scottish|irish|welsh|canadian|australian|russian|norwegian|swedish|danish|finnish|icelandic|german|french|italian|spanish|japanese|chinese|korean|indian";
const NOISE = [new RegExp(`^(${NATIONALITIES}) (fiction|literature|novels?)\\b`), / in literature$/, /^fiction in /];

const keyOf = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

// "Fantasy fiction" / "Mystery stories" / "Romance novels" -> try without the suffix
const SUFFIX = / (fiction|stories|novels|literature|books)$/;

function lookup(term, known) {
  const key = keyOf(term);
  if (!key) return null;
  if (known.has(key)) return [known.get(key)];
  if (SYNONYMS[key]) return [].concat(SYNONYMS[key]);
  const short = key.replace(SUFFIX, "");
  if (short !== key) {
    if (known.has(short)) return [known.get(short)];
    if (SYNONYMS[short]) return [].concat(SYNONYMS[short]);
  }
  return null;
}

/**
 * Sort incoming genres into ones we already have and ones that would be new.
 * `existing` = the library's genre names (from GET /api/books/genres).
 * Returns { matched: string[], unknown: string[] }.
 *
 * Open Library subjects like "Fiction, romance, contemporary" are split on
 * commas and each part mapped; parts that don't map are treated as noise
 * rather than offered as new genres.
 */
export function mapGenres(incoming = [], existing = []) {
  const known = new Map(existing.map((g) => [keyOf(g), g]));
  const matched = [];
  const unknown = [];
  const addMatched = (g) => {
    if (!matched.includes(g)) matched.push(g);
  };

  for (const raw of incoming) {
    const key = keyOf(raw);
    if (!key || IGNORE.has(key) || NOISE.some((re) => re.test(key))) continue;

    const direct = lookup(raw, known);
    if (direct) {
      direct.forEach(addMatched);
      continue;
    }
    if (key.includes(",")) {
      // Compound subject: keep whatever parts map, drop the rest
      key.split(",").forEach((part) => (lookup(part, known) || []).forEach(addMatched));
      continue;
    }
    if (/[()]/.test(raw) || key.split(" ").length > 4) continue; // place names, long subject headings
    const pretty = String(raw).trim();
    if (!unknown.some((u) => keyOf(u) === key)) unknown.push(pretty);
  }

  // A synonym target that isn't in the library (yet) is a new genre too
  const knownNames = new Set(existing);
  return {
    matched: matched.filter((g) => knownNames.has(g)),
    unknown: [...unknown, ...matched.filter((g) => !knownNames.has(g) && !unknown.includes(g))],
  };
}

/** One typed genre -> our spelling of it if we have it (or a synonym), else as typed. */
export function canonicalGenre(typed, existing = []) {
  const known = new Map(existing.map((g) => [keyOf(g), g]));
  const hit = lookup(typed, known);
  const inLibrary = hit?.filter((g) => existing.includes(g));
  return inLibrary?.length ? inLibrary[0] : String(typed).trim();
}

/**
 * Genres to suggest while typing in the genre picker, best match first:
 * names that start with the query, then names containing it, then genres
 * reached through a synonym ("krim" -> Crime, "sci" -> Science Fiction).
 * `existing` is ordered by how many books use each genre.
 */
export function suggestGenres(query, existing = [], exclude = []) {
  const q = keyOf(query);
  const skip = new Set(exclude);
  const available = existing.filter((g) => !skip.has(g));
  if (!q) return available;

  const starts = [];
  const contains = [];
  for (const g of available) {
    const k = keyOf(g);
    if (k.startsWith(q) || k.split(/[\s&/-]+/).some((w) => w.startsWith(q))) starts.push(g);
    else if (k.includes(q)) contains.push(g);
  }
  const viaSynonym = [];
  const inLibrary = new Set(available);
  for (const [term, target] of Object.entries(SYNONYMS)) {
    // Combined synonyms ("historical fantasy" -> Historical + Fantasy) would
    // make "his" suggest Fantasy - only use single-genre ones here
    if (!term.startsWith(q) || Array.isArray(target)) continue;
    for (const g of [target]) {
      if (inLibrary.has(g) && !starts.includes(g) && !contains.includes(g) && !viaSynonym.includes(g)) viaSynonym.push(g);
    }
  }
  return [...starts, ...contains, ...viaSynonym];
}
