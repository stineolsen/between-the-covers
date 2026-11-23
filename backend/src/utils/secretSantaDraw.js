const crypto = require("crypto");

// Fisher-Yates with a cryptographic random source
function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Random Secret Santa pairing: every participant gives to exactly one other
// participant and receives from exactly one, and nobody draws themselves.
// Reshuffles until no one has themselves - this picks uniformly among all
// valid draws (~3 tries on average, so it's instant for a book club).
function drawPairs(participantIds) {
  const ids = participantIds.map(String);
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate participants");
  if (ids.length < 2) throw new Error("Need at least two participants");

  for (;;) {
    const receivers = shuffle(ids);
    if (receivers.every((r, i) => r !== ids[i])) {
      return ids.map((giver, i) => ({ giver, receiver: receivers[i] }));
    }
  }
}

module.exports = { drawPairs };
