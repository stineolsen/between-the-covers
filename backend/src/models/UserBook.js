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
      enum: ["to-read", "currently-reading", "read"],
      default: "to-read",
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
    select: "title author coverImage genres averageRating",
  });
});

module.exports = mongoose.model("UserBook", userBookSchema);
