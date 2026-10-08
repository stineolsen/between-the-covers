const mongoose = require("mongoose");

// One row per user+door, summarizing the attempts. This is what the
// leaderboard, feed and badge-awarder read from - cheaper than recomputing
// from AdventAttempt on every request, and it's where the leaderboard
// eligibility decision (solved within the deadline or not) gets recorded
// once, at the moment the door is finished for that user.
const adventResultSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    adventDay: { type: mongoose.Schema.Types.ObjectId, ref: "AdventDay", required: true },
    status: { type: String, enum: ["in_progress", "solved", "failed"], default: "in_progress" },
    attemptsUsed: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    openedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    // False when the door was solved/failed after its own leaderboard
    // deadline had already passed (still playable, just doesn't score).
    countsForLeaderboard: { type: Boolean, default: true },
  },
  { timestamps: true },
);

adventResultSchema.index({ user: 1, adventDay: 1 }, { unique: true });
adventResultSchema.index({ adventDay: 1, status: 1 });

module.exports = mongoose.model("AdventResult", adventResultSchema);
