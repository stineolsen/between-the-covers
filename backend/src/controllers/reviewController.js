const Review = require('../models/Review');
const Book = require('../models/Book');

// @desc    Get all reviews (with optional filters)
// @route   GET /api/reviews
// @access  Public (but need to be logged in)
exports.getReviews = async (req, res, next) => {
  try {
    const { bookId, userId, sort = 'newest' } = req.query;

    // Build query
    let query = {};
    if (bookId) query.book = bookId;
    if (userId) query.user = userId;

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'highest-rated':
        sortOption = { rating: -1, createdAt: -1 };
        break;
      case 'lowest-rated':
        sortOption = { rating: 1, createdAt: -1 };
        break;
      case 'most-liked':
        sortOption = { likeCount: -1, createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const reviews = await Review.find(query)
      .sort(sortOption)
      .populate('book', 'title author coverImage')
      .populate('user', 'username displayName avatar');

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
};

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
exports.getReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('book', 'title author coverImage')
      .populate('user', 'username displayName avatar');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review'
    });
  }
};

// @desc    Create review
// @route   POST /api/reviews
// @access  Private (approved members only)
exports.createReview = async (req, res, next) => {
  try {
    const { bookId, rating, title, content, readingDate, spoilers } = req.body;

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if user already reviewed this book
    const existingReview = await Review.findOne({
      book: bookId,
      user: req.user._id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this book. Please edit your existing review.'
      });
    }

    // Create review
    const review = await Review.create({
      book: bookId,
      user: req.user._id,
      rating,
      title,
      content,
      readingDate,
      spoilers: spoilers || false
    });

    // Populate user info
    await review.populate('user', 'username displayName avatar');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create review'
    });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (review owner only)
exports.updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    const { rating, title, content, readingDate, spoilers } = req.body;

    // Update fields
    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (content !== undefined) review.content = content;
    if (readingDate !== undefined) review.readingDate = readingDate;
    if (spoilers !== undefined) review.spoilers = spoilers;

    await review.save();

    // Populate user info
    await review.populate('user', 'username displayName avatar');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update review'
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (review owner or admin)
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership or admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await review.remove();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
  }
};

// @desc    Toggle like on review
// @route   POST /api/reviews/:id/like
// @access  Private
exports.toggleLike = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.toggleLike(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Like toggled successfully',
      likeCount: review.likeCount,
      isLiked: review.likes.some(id => id.toString() === req.user._id.toString())
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like'
    });
  }
};

// @desc    Get user's review for a book
// @route   GET /api/reviews/book/:bookId/user
// @access  Private
exports.getUserReviewForBook = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      book: req.params.bookId,
      user: req.user._id
    }).populate('user', 'username displayName avatar');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'No review found'
      });
    }

    res.status(200).json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Get user review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review'
    });
  }
};
