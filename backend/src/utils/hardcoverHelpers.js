// Hardcover.app GraphQL integration — a best-effort third metadata source for
// the Add Book search, alongside the frontend's direct Open Library / NB
// calls. Unlike those, Hardcover requires a secret API key, so it has to be
// proxied through the backend (see bookController.searchExternalSources).
//
// Every failure mode here (missing key, network error, unexpected schema)
// resolves to an empty result rather than throwing — this is enrichment, it
// must never break the rest of the Add Book search.

const HARDCOVER_ENDPOINT = "https://api.hardcover.app/v1/graphql";

async function hardcoverGraphQL(query, variables) {
  const apiKey = process.env.HARDCOVER_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(HARDCOVER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Hardcover API request failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`Hardcover API error: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

// Book barcodes are EAN-13, and for books that *is* the ISBN-13 — no
// conversion needed. Matches a scanned barcode or a plain typed ISBN-10/13
// (with or without hyphens/spaces).
function looksLikeIsbn(q) {
  const stripped = q.replace(/[-\s]/g, "");
  return /^\d{9}[\dXx]$/.test(stripped) || /^\d{13}$/.test(stripped);
}

// Hardcover's language names -> the English names the rest of the app uses
// (backend normalizes these for MongoDB's text index anyway)
const normalizeLanguage = (name) => {
  if (!name) return "";
  if (/^norw|bokmål|nynorsk/i.test(name)) return "Norwegian";
  return name;
};

// Authors only - Hardcover also lists translators, illustrators, narrators...
// `contributions` are { author: { name }, contribution: "Author" | ... }.
const authorsFrom = (contributions = []) => {
  const list = Array.isArray(contributions) ? contributions : [];
  const authors = list.filter((c) => !c?.contribution || c.contribution === "Author");
  return (authors.length ? authors : list)
    .map((c) => c?.author?.name || c?.name)
    .filter(Boolean)
    .join(", ");
};

// On a book, cached_tags is grouped by category: { Genre: [{ tag }], Mood: [...], Tag: [...] }
const genresFromCachedTags = (cachedTags) =>
  (Array.isArray(cachedTags) ? cachedTags : cachedTags?.Genre || [])
    .map((t) => t?.tag || t?.name)
    .filter(Boolean)
    .slice(0, 6);

const EMPTY = { year: "", pageCount: "", isbn: "", genres: [], language: "", series: "", seriesNumber: "", description: "" };

// A text-search hit (Typesense document). Work-level data: the ISBN list
// spans every edition in every language, so no ISBN is picked from it -
// scanning/typing an ISBN gives the exact edition instead. Language isn't
// in the search index either; English matches what Open Library hits get.
function normalizeSearchDocument(doc) {
  if (!doc?.title) return null;
  const series = doc.featured_series?.series?.name || (doc.series_names || [])[0] || "";
  return {
    ...EMPTY,
    key: `hc-${doc.id || doc.slug}`,
    title: doc.title,
    author: authorsFrom(doc.contributions) || (doc.author_names || []).join(", "),
    year: doc.release_year || "",
    pageCount: doc.pages || "",
    genres: (doc.genres || []).slice(0, 6),
    language: "English",
    series,
    seriesNumber: series && doc.featured_series?.position != null ? doc.featured_series.position : "",
    description: doc.description || "",
    coverUrl: doc.image?.url || "",
  };
}

// An ISBN hit: one specific edition (pages, language, ISBN) of a book
// (author, original year, genres, series, description).
function normalizeEdition(edition, isbn) {
  const book = edition?.book;
  if (!book?.title) return null;
  const featured = (book.book_series || [])[0];
  const series = featured?.series?.name || "";
  return {
    ...EMPTY,
    key: `hc-${book.id}-${edition.isbn_13 || isbn}`,
    title: book.title,
    author: authorsFrom(book.cached_contributors),
    year: book.release_year || (edition.release_date || "").slice(0, 4) || "",
    pageCount: edition.pages || book.pages || "",
    isbn: edition.isbn_13 || isbn,
    genres: genresFromCachedTags(book.cached_tags),
    language: normalizeLanguage(edition.language?.language),
    series,
    seriesNumber: series && featured?.position != null ? featured.position : "",
    description: book.description || "",
    coverUrl: edition.image?.url || book.image?.url || "",
  };
}

const ISBN_QUERY = `
  query ($isbn: String!) {
    editions(where: { _or: [{ isbn_13: { _eq: $isbn } }, { isbn_10: { _eq: $isbn } }] }, limit: 5) {
      isbn_13
      pages
      release_date
      language { language }
      image { url }
      book {
        id
        title
        pages
        release_year
        description
        cached_contributors
        cached_tags
        image { url }
        book_series(where: { featured: { _eq: true } }, limit: 1) {
          position
          series { name }
        }
      }
    }
  }
`;

const TEXT_SEARCH_QUERY = `
  query ($q: String!) {
    search(query: $q, query_type: "books", per_page: 5, page: 1) {
      results
    }
  }
`;

async function searchByIsbn(isbn) {
  const data = await hardcoverGraphQL(ISBN_QUERY, { isbn });
  return (data?.editions || []).map((e) => normalizeEdition(e, isbn)).filter(Boolean);
}

async function searchByText(q) {
  const data = await hardcoverGraphQL(TEXT_SEARCH_QUERY, { q });
  // search() returns a loosely-typed Typesense blob: { hits: [{ document }] }
  const raw = data?.search?.results;
  const hits = Array.isArray(raw) ? raw : raw?.hits || raw?.data || [];
  return hits.map((hit) => normalizeSearchDocument(hit.document || hit)).filter(Boolean);
}

// The public entry point: best-effort search, never throws.
async function searchHardcover(q) {
  if (!q || !q.trim()) return [];
  try {
    if (looksLikeIsbn(q)) {
      const isbnResults = await searchByIsbn(q.replace(/[-\s]/g, ""));
      if (isbnResults.length > 0) return isbnResults;
      // Fall through to text search — some editions aren't indexed by ISBN.
    }
    return await searchByText(q);
  } catch (error) {
    console.error("Hardcover search error:", error.message);
    return [];
  }
}

module.exports = { searchHardcover };
