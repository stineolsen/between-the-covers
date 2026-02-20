const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a book title"],
      trim: true,
    },
    author: {
      type: String,
      required: [true, "Please provide an author name"],
      trim: true,
    },
    isbn: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: null, // Local file path or URL
    },
    publishedYear: {
      type: Number,
      min: 0,
      max: new Date().getFullYear() + 1,
    },
    genres: [
      {
        type: String,
        trim: true,
      },
    ],
    pageCount: {
      type: Number,
      min: 0,
    },
    publisher: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      default: "English",
    },

    // Series information
    series: {
      type: String,
      trim: true,
      default: null,
    },
    seriesNumber: {
      type: Number,
      min: 0,
      default: null,
    },

    // Club-specific data
    bookclubMonth: {
      type: String,
      default: null,
      trim: true,
      // Format: "January 2026", "February 2025", etc. or null
    },
    dateAdded: {
      type: Date,
      default: Date.now,
    },

    // Library links (audiobook and ebook)
    libraryLinks: {
      audiobook: {
        type: String,
        default: null,
      },
      ebook: {
        type: String,
        default: null,
      },
    },

    // Future Calibre-web integration (Phase 2+)
    calibreId: {
      type: String,
      default: null,
      sparse: true,
    },
    calibreDownloadLink: {
      type: String,
      default: null,
    },

    // Aggregated stats (calculated from reviews)
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Admin tracking
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
bookSchema.index({ title: "text", author: "text", series: "text" });
bookSchema.index({ bookclubMonth: 1 });
bookSchema.index({ genres: 1 });
bookSchema.index({ series: 1 });
bookSchema.index({ averageRating: -1 });

// Virtual for checking if book has cover image
bookSchema.virtual("hasCover").get(function () {
  return !!this.coverImage;
});

// Method to update average rating
bookSchema.methods.updateAverageRating = async function () {
  const Review = mongoose.model("Review");
  const stats = await Review.aggregate([
    { $match: { bookId: this._id } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    this.averageRating = Math.round(stats[0].averageRating * 10) / 10;
    this.reviewCount = stats[0].count;
  } else {
    this.averageRating = 0;
    this.reviewCount = 0;
  }

  await this.save();
};

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
