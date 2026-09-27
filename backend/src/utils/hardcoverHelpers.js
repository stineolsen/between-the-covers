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

function normalizeHardcoverBook(book) {
  if (!book) return null;
  const author = (book.cached_contributors || [])
    .map((c) => c?.author?.name || c?.name)
    .filter(Boolean)
    .join(", ");
  const genres = (book.cached_tags || [])
    .map((t) => t?.tag || t?.name)
    .filter(Boolean)
    .slice(0, 6);

  return {
    key: `hc-${book.id || book.slug}`,
    title: book.title || "",
    author,
    year: "",
    pageCount: "",
    isbn: "",
    genres,
    language: "",
    series: "",
    coverUrl: book.image?.url || "",
  };
}

const ISBN_QUERY = `
  query ($isbn: String!) {
    editions(where: { _or: [{ isbn_13: { _eq: $isbn } }, { isbn_10: { _eq: $isbn } }] }, limit: 5) {
      isbn_13
      book {
        id
        slug
        title
        cached_contributors
        cached_tags
        image { url }
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
  const editions = data?.editions || [];
  return editions
    .map((e) => {
      const normalized = normalizeHardcoverBook(e.book);
      if (normalized) normalized.isbn = e.isbn_13 || isbn;
      return normalized;
    })
    .filter(Boolean);
}

async function searchByText(q) {
  const data = await hardcoverGraphQL(TEXT_SEARCH_QUERY, { q });
  // Hardcover's search() returns a loosely-typed JSON blob (`results`) whose
  // exact shape isn't pinned down in their public docs — defensively probe
  // the couple of shapes their examples show rather than assuming one.
  const raw = data?.search?.results;
  const hits = Array.isArray(raw) ? raw : raw?.hits || raw?.data || [];
  return hits.map((hit) => normalizeHardcoverBook(hit.document || hit)).filter(Boolean);
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
