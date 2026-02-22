const Recommendation = require('../models/Recommendation');
const Book = require('../models/Book');
const UserBook = require('../models/UserBook');

// @desc    Send a book recommendation to other members
// @route   POST /api/recommendations
// @access  Private
exports.createRecommendation = async (req, res) => {
  try {
    const { bookId, recipientIds, message } = req.body;

    if (!bookId || !recipientIds || recipientIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Bok og mottakere er påkrevd' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Boken ble ikke funnet' });
    }

    // Remove sender from recipients
    const senderId = req.user._id.toString();
    const filteredRecipients = recipientIds.filter(id => id.toString() !== senderId);

    if (filteredRecipients.length === 0) {
      return res.status(400).json({ success: false, message: 'Ingen gyldige mottakere' });
    }

    const recommendation = await Recommendation.create({
      book: bookId,
      from: req.user._id,
      recipients: filteredRecipients,
      message: message?.trim() || undefined
    });

    res.status(201).json({ success: true, message: 'Anbefaling sendt!', recommendation });
  } catch (error) {
    console.error('Create recommendation error:', error);
    res.status(500).json({ success: false, message: 'Klarte ikke sende anbefaling' });
  }
};

// @desc    Get recommendations sent to the logged-in user
// @route   GET /api/recommendations/mine
// @access  Private
exports.getMyRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find recommendations where user is a recipient and hasn't dismissed
    const recommendations = await Recommendation.find({
      recipients: userId,
      dismissedBy: { $ne: userId }
    })
      .sort({ createdAt: -1 })
      .populate('book', 'title author coverImage')
      .populate('from', 'displayName username avatar');

    // Filter out books the user has already added to their reading list
    const userBooks = await UserBook.find({ user: userId }).select('book');
    const userBookIds = new Set(userBooks.map(ub => ub.book.toString()));

    const filtered = recommendations.filter(
      rec => rec.book && !userBookIds.has(rec.book._id.toString())
    );

    res.status(200).json({ success: true, recommendations: filtered });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ success: false, message: 'Klarte ikke hente anbefalinger' });
  }
};

// @desc    Dismiss a recommendation
// @route   PATCH /api/recommendations/:id/dismiss
// @access  Private
exports.dismissRecommendation = async (req, res) => {
  try {
    const recommendation = await Recommendation.findOneAndUpdate(
      { _id: req.params.id, recipients: req.user._id },
      { $addToSet: { dismissedBy: req.user._id } },
      { new: true }
    );

    if (!recommendation) {
      return res.status(404).json({ success: false, message: 'Anbefaling ikke funnet' });
    }

    res.status(200).json({ success: true, message: 'Anbefaling avvist' });
  } catch (error) {
    console.error('Dismiss recommendation error:', error);
    res.status(500).json({ success: false, message: 'Klarte ikke avvise anbefaling' });
  }
};
