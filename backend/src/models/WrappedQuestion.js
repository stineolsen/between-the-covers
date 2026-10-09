const mongoose = require("mongoose");

const wrappedQuestionSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
    },

    label: {
      type: String,
      required: [true, "Spørsmålet må ha en tekst"],
      trim: true,
    },

    type: {
      type: String,
      enum: ["text", "number", "book-library", "book-bookclub"],
      required: true,
    },

    // Optional helper text shown under the label, e.g. "navn + bok"
    helper: {
      type: String,
      trim: true,
      default: "",
    },

    order: {
      type: Number,
      default: 0,
    },

    // Soft-hide without losing historical answers tied to this question
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

wrappedQuestionSchema.index({ year: 1, order: 1 });

module.exports = mongoose.model("WrappedQuestion", wrappedQuestionSchema);
