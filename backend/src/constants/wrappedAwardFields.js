// Keys of the Book Awards nomination categories, kept in sync with the
// WrappedResponse.awards schema (models/WrappedResponse.js) and with the
// frontend's own copy in frontend/src/constants/wrappedAwardFields.js (the
// two can't share a module across the Node/Vite boundary, so the list is
// duplicated - keep both in sync when a category is added/removed).
const AWARD_FIELDS = [
  { key: "bestBook" },
  { key: "worstBook" },
  { key: "mostTalkedAbout" },
  { key: "mostConfusing" },
  { key: "bestHateRead" },
  { key: "favoriteCharacter" },
  { key: "mostAnnoyingCharacter" },
  { key: "bestSideCharacter" },
  { key: "bestSpicyScene" },
];

module.exports = { AWARD_FIELDS };
