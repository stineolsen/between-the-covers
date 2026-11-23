// Google Books lookups for a library book (page count, year, categories,
// description). Runs on the backend so the API key - GOOGLE_BOOKS_API_KEY,
// optional - is never sent to the browser. Without a key Google allows a
// small shared quota and often answers 429; with one, ~1000 lookups a day.

const API = "https://www.googleapis.com/books/v1/volumes";
const TIMEOUT_MS = 8000;

async function query(q) {
  const params = new URLSearchParams({ q, maxResults: "5", printType: "books" });
  if (process.env.GOOGLE_BOOKS_API_KEY) params.set("key", process.env.GOOGLE_BOOKS_API_KEY);

  const res = await fetch(`${API}?${params}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (res.status === 429) {
    const err = new Error("Google Books-kvoten er brukt opp for nå");
    err.status = 429;
    throw err;
  }
  if (!res.ok) throw new Error(`Google Books svarte ${res.status}`);
  const data = await res.json();
  return data.items || [];
}

const summary = (item) => {
  const v = item.volumeInfo || {};
  const isbn = (v.industryIdentifiers || []).find((i) => i.type === "ISBN_13")?.identifier || null;
  return {
    googleId: item.id,
    title: v.title || null,
    authors: v.authors || [],
    pageCount: v.pageCount || null,
    publishedYear: Number(String(v.publishedDate || "").slice(0, 4)) || null,
    categories: v.categories || [],
    description: v.description || null,
    isbn,
    thumbnail: v.imageLinks?.thumbnail?.replace(/^http:/, "https:") || null,
    link: v.infoLink || null,
  };
};

// ISBN first (exact edition), then title + first author. Prefers the first
// hit that actually has a page count.
async function lookupBook({ isbn, title, author }) {
  const cleanIsbn = String(isbn || "").replace(/[^0-9Xx]/g, "");
  let items = cleanIsbn ? await query(`isbn:${cleanIsbn}`) : [];
  if (!items.length && title) {
    const firstAuthor = String(author || "").split(/\s*[|,&]\s*/)[0];
    items = await query(firstAuthor ? `intitle:"${title}" inauthor:"${firstAuthor}"` : `intitle:"${title}"`);
  }
  if (!items.length) return null;
  const best = items.find((i) => i.volumeInfo?.pageCount) || items[0];
  return summary(best);
}

module.exports = { lookupBook };
