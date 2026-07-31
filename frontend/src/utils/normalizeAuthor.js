// Mirrors backend/src/utils/importHelpers.js's normalizeAuthor exactly, so a
// link built from book.author here always matches the authorNormalized value
// stored on the book without a round trip to the server.
export function normalizeAuthor(author) {
  return (author || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
