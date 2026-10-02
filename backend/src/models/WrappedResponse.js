const mongoose = require("mongoose");

const wrappedResponseSchema = new mongoose.Schema(
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

    // Books the user has unchecked in step 1 (matched the year by date, but
    // shouldn't count toward their wrapped) - everything else that matches
    // the year is assumed included by default.
    excludedBookIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
      },
    ],

    // The private List (see List.js) created to hold this user's
    // drag-ranked order of the year's bookclub books.
    rankingListId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "List",
      default: null,
    },

    // One entry per answered WrappedQuestion - only the field matching the
    // question's type is populated, the other two stay null.
    answers: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "WrappedQuestion",
          required: true,
        },
        textValue: { type: String, trim: true, default: null },
        numberValue: { type: Number, default: null },
        bookValue: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Book",
          default: null,
        },
      },
    ],

    stepsCompleted: {
      confirmList: { type: Boolean, default: false },
      ranking: { type: Boolean, default: false },
      awards: { type: Boolean, default: false },
    },

    submittedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// One response per user per year
wrappedResponseSchema.index({ user: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("WrappedResponse", wrappedResponseSchema);
