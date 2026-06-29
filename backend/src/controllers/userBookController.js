const UserBook = require("../models/UserBook");
const Book = require("../models/Book");
const Review = require("../models/Review");
const User = require("../models/User");

// @desc    Get user's books (optionally filtered by status)
// @route   GET /api/user-books
// @access  Private
exports.getUserBooks = async (req, res) => {
  try {
    const { status, owned } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;
    if (owned === "true") query.owned = true;

    const userBooks = await UserBook.find(query).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: userBooks.length,
      userBooks,
    });
  } catch (error) {
    console.error("Get user books error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user books",
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
      book: req.params.bookId,
    });

    if (!userBook) {
      return res.status(404).json({
        success: false,
        message: "No status found for this book",
      });
    }

    res.status(200).json({
      success: true,
      userBook,
    });
  } catch (error) {
    console.error("Get user book status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch book status",
    });
  }
};

// @desc    Set/Update user's reading status for a book
// @route   POST /api/user-books
// @access  Private
exports.setBookStatus = async (req, res) => {
  try {
    const { bookId, status, notes } = req.body;
    console.log("Set book status request:", {
      userId: req.user?._id,
      bookId,
      status,
      notes,
    });

    // Validate book exists
    const book = await Book.findById(bookId);
    if (!book) {
      console.log("Noe er feil, finner ikke boken:", bookId);
      return res.status(404).json({
        success: false,
        message: "Noe er feil, finner ikke boken",
      });
    }

    // Check if user already has this book
    let userBook = await UserBook.findOne({
      user: req.user._id,
      book: bookId,
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
        notes: notes || "",
      });
      await userBook.populate(
        "book",
        "title author coverImage genres averageRating",
      );
    }

    res.status(200).json({
      success: true,
      message: "Reading status updated successfully",
      userBook,
    });
  } catch (error) {
    console.error("Set book status error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update reading status",
    });
  }
};

// @desc    Update finished reading date
// @route   PATCH /api/user-books/:id
// @access  Private
exports.updateFinishedDate = async (req, res) => {
  try {
    const { finishedAt } = req.body;

    const userBook = await UserBook.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { finishedAt: finishedAt ? new Date(finishedAt) : null } },
      { new: true },
    );

    if (!userBook) {
      return res
        .status(404)
        .json({ success: false, message: "Noe er feil, finner ikke boken in your list" });
    }

    // Sync readingDate on the user's review for this book (if one exists)
    if (finishedAt && userBook.book) {
      await Review.findOneAndUpdate(
        { book: userBook.book, user: req.user._id },
        { $set: { readingDate: new Date(finishedAt) } },
      );
    }

    res
      .status(200)
      .json({ success: true, message: "Reading date updated", userBook });
  } catch (error) {
    console.error("Update finished date error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update reading date" });
  }
};

// @desc    Remove book from user's list
// @route   DELETE /api/user-books/:id
// @access  Private
exports.removeUserBook = async (req, res) => {
  try {
    const userBook = await UserBook.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!userBook) {
      return res.status(404).json({
        success: false,
        message: "Noe er feil, finner ikke boken in your list",
      });
    }

    await userBook.remove();

    res.status(200).json({
      success: true,
      message: "Book removed from your list",
    });
  } catch (error) {
    console.error("Remove user book error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove book",
    });
  }
};

// @desc    Get all users who have read a specific book
// @route   GET /api/user-books/readers/:bookId
// @access  Private
exports.getBookReaders = async (req, res) => {
  try {
    const readers = await UserBook.find({
      book: req.params.bookId,
      status: "read",
    })
      .populate("user", "username displayName avatar")
      .sort({ finishedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      readers: readers.map((r) => ({
        user: r.user,
        finishedAt: r.finishedAt,
      })),
    });
  } catch (error) {
    console.error("Get book readers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch readers" });
  }
};

// @desc    Toggle hidden flag for a book
// @route   PATCH /api/user-books/:bookId/hidden
// @access  Private
exports.toggleHidden = async (req, res) => {
  try {
    let userBook = await UserBook.findOne({
      user: req.user._id,
      book: req.params.bookId,
    });

    if (userBook) {
      userBook.hidden = !userBook.hidden;
      await userBook.save();
    } else {
      userBook = await UserBook.create({
        user: req.user._id,
        book: req.params.bookId,
        hidden: true,
        status: null,
      });
    }

    res.status(200).json({ success: true, hidden: userBook.hidden });
  } catch (error) {
    console.error("Toggle hidden error:", error);
    res.status(500).json({ success: false, message: "Failed to update hidden state" });
  }
};

// @desc    Toggle owned flag for a book
// @route   PATCH /api/user-books/:bookId/owned
// @access  Private
exports.toggleOwned = async (req, res) => {
  try {
    let userBook = await UserBook.findOne({
      user: req.user._id,
      book: req.params.bookId,
    });

    if (userBook) {
      userBook.owned = !userBook.owned;
      await userBook.save();
    } else {
      userBook = await UserBook.create({
        user: req.user._id,
        book: req.params.bookId,
        owned: true,
        status: null,
      });
    }

    res.status(200).json({ success: true, owned: userBook.owned });
  } catch (error) {
    console.error("Toggle owned error:", error);
    res.status(500).json({ success: false, message: "Failed to update ownership" });
  }
};

// @desc    Get users who own a specific book
// @route   GET /api/user-books/owners/:bookId
// @access  Private
exports.getBookOwners = async (req, res) => {
  try {
    const owners = await UserBook.find({
      book: req.params.bookId,
      owned: true,
    })
      .populate("user", "username displayName avatar")
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      owners: owners.map((r) => ({ user: r.user })),
    });
  } catch (error) {
    console.error("Get book owners error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch owners" });
  }
};

// @desc    Get users who have a book on their TBR
// @route   GET /api/user-books/tbr/:bookId
// @access  Private
exports.getBookTBR = async (req, res) => {
  try {
    const tbr = await UserBook.find({
      book: req.params.bookId,
      status: "to-read",
    })
      .populate("user", "username displayName avatar")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      tbr: tbr.map((r) => ({ user: r.user })),
    });
  } catch (error) {
    console.error("Get book TBR error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch TBR list" });
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
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      "to-read": 0,
      "currently-reading": 0,
      read: 0,
    };

    stats.forEach((stat) => {
      formattedStats[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      stats: formattedStats,
    });
  } catch (error) {
    console.error("Get reading stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reading statistics",
    });
  }
};
