// Seeded the first time anyone (member or admin) touches a given year's
// Book Awards questions - admin can then freely add/edit/remove/reorder
// from here via the WrappedQuestion admin endpoints.
const DEFAULT_QUESTIONS = [
  { label: "Årets beste bok", type: "book-library" },
  { label: "Årets dårligste bok", type: "book-library" },
  { label: "Årets mest snakket om bok", type: "book-library" },
  { label: "Mest forvirrende bok", type: "book-library" },
  { label: 'Beste "hate read"', type: "book-library" },
  { label: "Årets favorittkarakter", type: "text", helper: "navn + bok" },
  { label: "Årets mest irriterende karakter", type: "text", helper: "navn + bok" },
  { label: "Årets beste sidekarakter", type: "text", helper: "navn + bok" },
  { label: "Årets beste smutscene", type: "text", helper: "valgfritt" },
];

module.exports = { DEFAULT_QUESTIONS };
