const BookRequest = require('../models/BookRequest');

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

// @desc    Submit a book request
// @route   POST /api/book-requests
// @access  Private
exports.createRequest = async (req, res) => {
  try {
    const { title, author, formats } = req.body;

    if (!title?.trim() || !author?.trim()) {
      return res.status(400).json({ success: false, message: 'Tittel og forfatter er påkrevd' });
    }

    const request = await BookRequest.create({
      title: title.trim(),
      author: author.trim(),
      formats: formats || [],
      requestedBy: req.user._id
    });

    res.status(201).json({ success: true, message: 'Forespørsel sendt!', request });
  } catch (error) {
    console.error('Create book request error:', error);
    res.status(500).json({ success: false, message: 'Klarte ikke sende forespørsel' });
  }
};

// @desc    Get requests by the logged-in user
//          Excludes "added" requests older than 2 weeks
// @route   GET /api/book-requests/mine
// @access  Private
exports.getMyRequests = async (req, res) => {
  try {
    const twoWeeksAgo = new Date(Date.now() - TWO_WEEKS_MS);

    const requests = await BookRequest.find({
      requestedBy: req.user._id,
      $or: [
        { status: 'pending' },
        { status: 'added', addedAt: { $gte: twoWeeksAgo } }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ success: false, message: 'Klarte ikke hente forespørsler' });
  }
};

// @desc    Get all requests (admin)
// @route   GET /api/book-requests
// @access  Admin
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await BookRequest.find({})
      .sort({ status: 1, createdAt: -1 })
      .populate('requestedBy', 'displayName username');

    res.status(200).json({ success: true, count: requests.length, requests });
  } catch (error) {
    console.error('Get all requests error:', error);
    res.status(500).json({ success: false, message: 'Klarte ikke hente forespørsler' });
  }
};

// @desc    Mark a request as added (admin)
// @route   PATCH /api/book-requests/:id/added
// @access  Admin
exports.markAsAdded = async (req, res) => {
  try {
    const request = await BookRequest.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'added', addedAt: new Date() } },
      { new: true }
    ).populate('requestedBy', 'displayName username');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Forespørsel ikke funnet' });
    }

    res.status(200).json({ success: true, message: 'Merket som lagt til', request });
  } catch (error) {
    console.error('Mark as added error:', error);
    res.status(500).json({ success: false, message: 'Klarte ikke oppdatere forespørsel' });
  }
};
