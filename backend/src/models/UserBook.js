const mongoose = require("mongoose");

const userBookSchema = new mongoose.Schema(
  {
    // User reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    // Book reference
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: [true, "Book is required"],
    },

    // User's personal reading status for this book
    status: {
      type: String,
      enum: ["to-read", "currently-reading", "read", "dnf"],
      default: null,
    },

    // Whether the user physically owns this book
    owned: {
      type: Boolean,
      default: false,
    },

    // Whether the user has hidden this book from their library view
    hidden: {
      type: Boolean,
      default: false,
    },

    // When user started reading
    startedAt: {
      type: Date,
      default: null,
    },

    // When user finished reading
    finishedAt: {
      type: Date,
      default: null,
    },

    // Reading progress (while currently reading). pageCount is the page count
    // of the member's own edition - it overrides the Book's pageCount for
    // their progress and reading plan only, never for anyone else.
    pageCount: {
      type: Number,
      min: 1,
      default: null,
    },
    currentPage: {
      type: Number,
      min: 0,
      default: 0,
    },
    progressUpdatedAt: {
      type: Date,
      default: null,
    },

    // Optional plan to finish by targetDate. startPage/startDate record where
    // the member was when the plan was made, so "ahead/behind" is measured
    // against the original pace.
    readingPlan: {
      type: new mongoose.Schema(
        {
          targetDate: { type: Date, required: true },
          startPage: { type: Number, default: 0 },
          startDate: { type: Date, required: true },
        },
        { _id: false },
      ),
      default: null,
    },

    // User's personal notes
    notes: {
      type: String,
      maxlength: 1000,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to ensure one entry per user per book
userBookSchema.index({ user: 1, book: 1 }, { unique: true });

// Index for querying user's books by status
userBookSchema.index({ user: 1, status: 1 });

// Middleware to update dates based on status changes
userBookSchema.pre("save", function () {
  // If status changed to 'currently-reading' and no startedAt date, set it
  if (this.isModified("status")) {
    if (this.status === "currently-reading" && !this.startedAt) {
      this.startedAt = new Date();
    }

    // If status changed to 'read' and no finishedAt date, set it
    if (this.status === "read" && !this.finishedAt) {
      this.finishedAt = new Date();
    }
  }
});

// Populate book details when querying
userBookSchema.pre(/^find/, function () {
  this.populate({
    path: "book",
    select: "title author coverImage genres averageRating pageCount isbn",
  });
});

module.exports = mongoose.model("UserBook", userBookSchema);
