const mongoose = require("mongoose");

// Every guess or skip, one row per attempt. This is the server's source of
// truth for "how many attempts has this user used" - the attempt count is
// never trusted from the client.
const adventAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    adventDay: { type: mongoose.Schema.Types.ObjectId, ref: "AdventDay", required: true },
    attemptNo: { type: Number, required: true, min: 1, max: 4 },
    action: { type: String, enum: ["guess", "skip"], required: true },
    guessedBook: { type: mongoose.Schema.Types.ObjectId, ref: "Book", default: null },
    result: { type: String, enum: ["wrong", "author", "correct"], required: true },
  },
  { timestamps: true },
);

adventAttemptSchema.index({ user: 1, adventDay: 1, attemptNo: 1 }, { unique: true });

module.exports = mongoose.model("AdventAttempt", adventAttemptSchema);
