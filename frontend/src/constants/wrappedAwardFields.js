// Book Awards nomination categories - shared between the member-facing
// AwardsStep form and the admin tally view, so the labels only live in one
// place. Keep in sync with the backend's own copy in
// backend/src/constants/wrappedAwardFields.js (key list only, no labels
// needed there) and with WrappedResponse.awards (models/WrappedResponse.js).
export const AWARD_FIELDS = [
  { key: "bestBook", label: "Årets beste bok" },
  { key: "worstBook", label: "Årets dårligste bok" },
  { key: "mostTalkedAbout", label: "Årets mest snakket om bok" },
  { key: "mostConfusing", label: "Mest forvirrende bok" },
  { key: "bestHateRead", label: 'Beste "hate read"' },
  { key: "favoriteCharacter", label: "Årets favorittkarakter", helper: "navn + bok" },
  { key: "mostAnnoyingCharacter", label: "Årets mest irriterende karakter", helper: "navn + bok" },
  { key: "bestSideCharacter", label: "Årets beste sidekarakter", helper: "navn + bok" },
  { key: "bestSpicyScene", label: "Årets beste smutscene", helper: "valgfritt" },
];
