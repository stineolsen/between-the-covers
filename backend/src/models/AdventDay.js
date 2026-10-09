const mongoose = require("mongoose");

// One door in the "gjett boka" advent calendar. Title/author/hints etc. stay
// secret until a player has either solved the door or run out of attempts
// (or the deadline for the door has passed) - adventController is
// responsible for never serializing these fields to a client that hasn't
// earned them. isbn/altTitles feed the guess-search endpoint.
const adventDaySchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    day: { type: Number, required: true, min: 1, max: 24 },

    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    altTitles: [{ type: String, trim: true }],
    isbn: { type: String, trim: true, default: null },

    // The Book document a correct guess must match - created by the seed
    // script with hiddenFromLibrary:true so it's guessable (shows up in
    // /api/advent/search) without appearing in the normal library listing
    // before the door's deadline publishes it.
    answerBookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },

    publishedYear: { type: Number, default: null },
    pageCount: { type: String, default: null }, // free text, e.g. "ca. 400"
    genre: { type: String, required: true },

    hint1: { type: String, default: "" },
    hint2: { type: String, default: "" },
    hint3: { type: String, default: "" },

    // Relative paths under backend/advent-images/<year>/<day>/ (see
    // utils/adventPaths.js - deliberately outside uploads/, which is served
    // as plain static files), served only through the gated image
    // controller.
    imageOriginalKey: { type: String, default: null },
    imageLevel1Key: { type: String, default: null },
    imageLevel2Key: { type: String, default: null },
    imageLevel3Key: { type: String, default: null },
    imageLevel4Key: { type: String, default: null },

    // Set once the door's deadline publishing job has unhidden answerBookId
    // in the library - makes that job idempotent regardless of how many
    // times it fires.
    publishedToLibraryAt: { type: Date, default: null },
  },
  { timestamps: true },
);

adventDaySchema.index({ year: 1, day: 1 }, { unique: true });

module.exports = mongoose.model("AdventDay", adventDaySchema);
