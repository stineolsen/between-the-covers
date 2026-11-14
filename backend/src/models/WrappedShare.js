const mongoose = require("mongoose");

// A member's Bokwrapped summary, shared with the club from the last slide
// of the results story. Shown on their profile and in the "Klubbens
// Bokwrapped" row on the homepage. The numbers are frozen at share time
// (computed server-side from wrappedStats, never sent by the client), so
// the card stays the same as what the member saw when they shared it.
// Optional single-nested bits of the snapshot (null when they don't apply)
const small = (fields) => new mongoose.Schema(fields, { _id: false });

const wrappedShareSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    snapshot: {
      count: { type: Number, default: 0 },
      pages: { type: Number, default: 0 },
      avgRating: { type: Number, default: null },
      topGenre: { type: String, default: null },
      personalities: [
        {
          _id: false,
          key: String,
          label: String,
          emoji: String,
        },
      ],
      // The member's highest-rated books (topped up with unrated ones)
      favorites: [
        {
          _id: false,
          bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
          title: String,
          coverImage: String,
          rating: { type: Number, default: null },
        },
      ],
      // Strongest "topp X %" vs the club, e.g. { topPercent: 10, label: "sider lest" }
      bestPercentile: { type: small({ topPercent: Number, label: String }), default: null },
      readingGoal: { type: small({ goal: Number, count: Number }), default: null },
      bookclub: {
        type: small({ read: Number, total: Number, meetingsAttended: Number, meetingsTotal: Number }),
        default: null,
      },
    },
  },
  {
    timestamps: true,
  },
);

// One shared summary per member per year - sharing again refreshes it
wrappedShareSchema.index({ user: 1, year: 1 }, { unique: true });
wrappedShareSchema.index({ year: 1, createdAt: -1 });

module.exports = mongoose.model("WrappedShare", wrappedShareSchema);
