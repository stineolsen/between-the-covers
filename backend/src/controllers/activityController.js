const Review = require('../models/Review');
const UserBook = require('../models/UserBook');
const Meeting = require('../models/Meeting');
const AdventResult = require('../models/AdventResult');
const AdventAttempt = require('../models/AdventAttempt');
const AdventDay = require('../models/AdventDay');

// @desc    Get recent activity feed for all club members
// @route   GET /api/activity
// @access  Private
exports.getActivity = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 25, 50);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    // Fetch in parallel
    // Review pre-hook auto-populates 'user'; add 'book' manually
    // UserBook pre-hook auto-populates 'book'; add 'user' manually
    // Meeting pre-hook auto-populates 'book', 'attendees', 'createdBy'
    const [reviews, userBooks, meetings, adventResults] = await Promise.all([
      Review.find({})
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('book', 'title author coverImage'),

      UserBook.find({})
        .sort({ updatedAt: -1 })
        .limit(30)
        .populate('user', 'displayName avatar username'),

      Meeting.find({
        status: { $in: ['upcoming', 'past'] },
        date: { $gte: sixtyDaysAgo }
      })
        .sort({ date: -1 })
        .limit(10),

      // Solved doors only (never failed attempts - see
      // docs/julekalender-design.md section 8), and never the book
      // title/author: just the door number and the colour sequence, like
      // sharing a Wordle result.
      AdventResult.find({ status: 'solved' })
        .sort({ finishedAt: -1 })
        .limit(30)
        .populate('user', 'displayName avatar username')
        .populate('adventDay', 'day year'),
    ]);

    // Map to unified activity shape
    const reviewActivities = reviews
      .filter(r => r.user && r.book)
      .map(r => ({
        type: 'review',
        user: r.user,
        book: r.book,
        rating: r.rating,
        reviewId: r._id,
        date: r.createdAt
      }));

    const statusActivities = userBooks
      .filter(ub => ub.user && ub.book && ub.status)
      .map(ub => {
        const date =
          ub.status === 'read' ? (ub.finishedAt || ub.createdAt) :
          ub.status === 'currently-reading' ? (ub.startedAt || ub.createdAt) :
          ub.createdAt;
        return {
          type: 'status',
          status: ub.status,
          user: ub.user,
          book: ub.book,
          date,
        };
      });

    const meetingActivities = meetings.map(m => ({
      type: 'meeting',
      meeting: {
        _id: m._id,
        title: m.title,
        date: m.date,
        status: m.status
      },
      attendees: m.attendees || [],
      bookTitle: m.book ? m.book.title : null,
      date: m.date
    }));

    const validAdventResults = adventResults.filter(r => r.user && r.adventDay);
    const adventAttempts = validAdventResults.length
      ? await AdventAttempt.find({
          user: { $in: validAdventResults.map(r => r.user._id) },
          adventDay: { $in: validAdventResults.map(r => r.adventDay._id) },
        }).sort({ attemptNo: 1 })
      : [];
    const squaresByKey = new Map();
    adventAttempts.forEach(a => {
      const key = `${a.user}_${a.adventDay}`;
      if (!squaresByKey.has(key)) squaresByKey.set(key, []);
      squaresByKey.get(key).push(a.result);
    });

    const adventActivities = validAdventResults.map(r => ({
      type: 'advent',
      user: r.user,
      day: r.adventDay.day,
      year: r.adventDay.year,
      points: r.points,
      squares: squaresByKey.get(`${r.user._id}_${r.adventDay._id}`) || [],
      date: r.finishedAt,
    }));

    // Merge, sort newest first, cap at limit
    const activities = [
      ...reviewActivities,
      ...statusActivities,
      ...meetingActivities,
      ...adventActivities
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    res.status(200).json({ success: true, activities });
  } catch (error) {
    console.error('Activity feed error:', error);
    res.status(500).json({ success: false, message: 'Klarte ikke laste aktivitetsstrøm' });
  }
};
