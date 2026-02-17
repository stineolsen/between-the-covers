const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Book reference
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book is required']
  },

  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },

  // Rating (1-5 stars)
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating must be at most 5']
  },

  // Review title
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Review title cannot exceed 100 characters']
  },

  // Review content
  content: {
    type: String,
    required: [true, 'Review content is required'],
    trim: true,
    minlength: [10, 'Review must be at least 10 characters'],
    maxlength: [5000, 'Review cannot exceed 5000 characters']
  },

  // Reading date
  readingDate: {
    type: Date
  },

  // Spoiler warning
  spoilers: {
    type: Boolean,
    default: false
  },

  // Likes (array of user IDs)
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Like count (denormalized for performance)
  likeCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
reviewSchema.index({ book: 1, user: 1 }, { unique: true }); // One review per user per book
reviewSchema.index({ book: 1, createdAt: -1 }); // Sort reviews by date
reviewSchema.index({ book: 1, rating: -1 }); // Sort reviews by rating
reviewSchema.index({ book: 1, likeCount: -1 }); // Sort reviews by popularity

// Virtual for checking if review has spoilers
reviewSchema.virtual('hasSpoilers').get(function() {
  return this.spoilers === true;
});

// Method to toggle like
reviewSchema.methods.toggleLike = function(userId) {
  const userIdStr = userId.toString();
  const likeIndex = this.likes.findIndex(id => id.toString() === userIdStr);

  if (likeIndex > -1) {
    // Unlike
    this.likes.splice(likeIndex, 1);
    this.likeCount = Math.max(0, this.likeCount - 1);
  } else {
    // Like
    this.likes.push(userId);
    this.likeCount += 1;
  }

  return this.save();
};

// Static method to calculate average rating for a book
reviewSchema.statics.calculateAverageRating = async function(bookId) {
  const result = await this.aggregate([
    { $match: { book: mongoose.Types.ObjectId(bookId) } },
    {
      $group: {
        _id: '$book',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  if (result.length > 0) {
    // Update the book with new average rating
    const Book = mongoose.model('Book');
    await Book.findByIdAndUpdate(bookId, {
      averageRating: Math.round(result[0].averageRating * 10) / 10, // Round to 1 decimal
      reviewCount: result[0].reviewCount
    });
  } else {
    // No reviews, reset to 0
    const Book = mongoose.model('Book');
    await Book.findByIdAndUpdate(bookId, {
      averageRating: 0,
      reviewCount: 0
    });
  }
};

// Middleware to update book rating after review save
reviewSchema.post('save', async function() {
  await this.constructor.calculateAverageRating(this.book);
});

// Middleware to update book rating after review delete
reviewSchema.post('remove', async function() {
  await this.constructor.calculateAverageRating(this.book);
});

// Populate user info when querying reviews
reviewSchema.pre(/^find/, function() {
  this.populate({
    path: 'user',
    select: 'username displayName avatar'
  });
});

module.exports = mongoose.model('Review', reviewSchema);
