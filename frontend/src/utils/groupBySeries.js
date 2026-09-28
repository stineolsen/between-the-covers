// Every distinct genre across a series' books, most-used first - stands in
// for a single book's own genre list on the collapsed series card.
const topGenres = (books) => {
  const counts = new Map();
  for (const book of books) {
    for (const genre of book.genres || []) {
      counts.set(genre, (counts.get(genre) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([genre]) => genre);
};

// Folds books that share a series into one entry, sitting at the position of
// the first member so the page's existing sort order is preserved. Books
// without a series - or a series with only one book in the current filtered
// results - stay as individual entries.
export const groupBySeries = (books) => {
  const groups = new Map();
  const items = [];

  for (const book of books) {
    const seriesName = book.series?.trim();
    if (!seriesName) {
      items.push({ type: "book", book });
      continue;
    }
    const key = seriesName.toLowerCase();
    let group = groups.get(key);
    if (!group) {
      group = { type: "series", seriesName, books: [] };
      groups.set(key, group);
      items.push(group);
    }
    group.books.push(book);
  }

  return items.map((item) => {
    if (item.type !== "series") return item;
    if (item.books.length === 1) return { type: "book", book: item.books[0] };
    return {
      ...item,
      books: [...item.books].sort((a, b) => (a.seriesNumber || 0) - (b.seriesNumber || 0)),
      genres: topGenres(item.books),
    };
  });
};
