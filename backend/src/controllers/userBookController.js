const UserBook = require('../models/UserBook');
const Book = require('../models/Book');

// @desc    Get user's books (optionally filtered by status)
// @route   GET /api/user-books
// @access  Private
exports.getUserBooks = async (req, res) => {
  try {
    const { status } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;

    const userBooks = await UserBook.find(query).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: userBooks.length,
      userBooks
    });
  } catch (error) {
    console.error('Get user books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user books'
    });
  }
};

// @desc    Get user's status for a specific book
// @route   GET /api/user-books/book/:bookId
// @access  Private
exports.getUserBookStatus = async (req, res) => {
  try {
    const userBook = await UserBook.findOne({
      user: req.user._id,
      book: req.params.bookId
    });

    if (!userBook) {
      return res.status(404).json({
        success: false,
        message: 'No status found for this book'
      });
    }

    res.status(200).json({
      success: true,
      userBook
    });
  } catch (error) {
    console.error('Get user book status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book status'
    });
  }
};

// @desc    Set/Update user's reading status for a book
// @route   POST /api/user-books
// @access  Private
exports.setBookStatus = async (req, res) => {
  try {
    const { bookId, status, notes } = req.body;

    // Validate book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if user already has this book
    let userBook = await UserBook.findOne({
      user: req.user._id,
      book: bookId
    });

    if (userBook) {
      // Update existing entry
      userBook.status = status;
      if (notes !== undefined) userBook.notes = notes;
      await userBook.save();
    } else {
      // Create new entry
      userBook = await UserBook.create({
        user: req.user._id,
        book: bookId,
        status,
        notes: notes || ''
      });
      await userBook.populate('book', 'title author coverImage genres averageRating');
    }

    res.status(200).json({
      success: true,
      message: 'Reading status updated successfully',
      userBook
    });
  } catch (error) {
    console.error('Set book status error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update reading status'
    });
  }
};

// @desc    Remove book from user's list
// @route   DELETE /api/user-books/:id
// @access  Private
exports.removeUserBook = async (req, res) => {
  try {
    const userBook = await UserBook.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!userBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found in your list'
      });
    }

    await userBook.remove();

    res.status(200).json({
      success: true,
      message: 'Book removed from your list'
    });
  } catch (error) {
    console.error('Remove user book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove book'
    });
  }
};

// @desc    Get reading statistics for user
// @route   GET /api/user-books/stats
// @access  Private
exports.getReadingStats = async (req, res) => {
  try {
    const stats = await UserBook.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      'to-read': 0,
      'currently-reading': 0,
      'read': 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      stats: formattedStats
    });
  } catch (error) {
    console.error('Get reading stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reading statistics'
    });
  }
};
