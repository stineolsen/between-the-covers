const WrappedResponse = require("../models/WrappedResponse");
const UserBook = require("../models/UserBook");
const Book = require("../models/Book");
const Review = require("../models/Review");
const List = require("../models/List");

// December collection window for a given wrapped year - 1st through the
// 27th (admin needs the rest of the holidays to generate the actual
// wrapped). Hardcoded for now; move to the Setting model if this ever needs
// to be admin-adjustable.
function getWindow(year) {
  return {
    start: new Date(`${year}-12-01T00:00:00`),
    end: new Date(`${year}-12-27T23:59:59`),
  };
}

function isWindowOpen(year) {
  const { start, end } = getWindow(year);
  const now = new Date();
  return now >= start && now <= end;
}

async function getOrCreateResponse(userId, year) {
  let response = await WrappedResponse.findOne({ user: userId, year });
  if (!response) {
    response = await WrappedResponse.create({ user: userId, year });
  }
  return response;
}

// @desc    Candidate books for step 1 (confirm reading list)
// @route   GET /api/wrapped/:year/overview
// @access  Private
exports.getOverview = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const userId = req.user._id;

    const userBooks = await UserBook.find({ user: userId, status: "read" }).sort({
      finishedAt: -1,
    });

    const candidates = userBooks.filter((ub) => {
      if (!ub.finishedAt) return true; // missing date - flag for review
      return new Date(ub.finishedAt).getFullYear() === year;
    });

    const response = await WrappedResponse.findOne({ user: userId, year });
    const excluded = new Set((response?.excludedBookIds || []).map((id) => id.toString()));

    const books = candidates.map((ub) => ({
      userBookId: ub._id,
      book: ub.book,
      finishedAt: ub.finishedAt,
      flagged: !ub.finishedAt,
      checked: !excluded.has(ub.book?._id?.toString()),
    }));

    res.status(200).json({ success: true, books });
  } catch (error) {
    console.error("Get wrapped overview error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente leselisten" });
  }
};

// @desc    Save which books count toward this year's wrapped
// @route   PUT /api/wrapped/:year/confirm-books
// @access  Private
exports.confirmBooks = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const { excludedBookIds } = req.body;

    const response = await getOrCreateResponse(req.user._id, year);
    response.excludedBookIds = Array.isArray(excludedBookIds) ? excludedBookIds : [];
    response.stepsCompleted.confirmList = true;
    await response.save();

    res.status(200).json({ success: true, message: "Leselisten er bekreftet", response });
  } catch (error) {
    console.error("Confirm wrapped books error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke lagre leselisten" });
  }
};

// @desc    Get (or lazily create) the user's bookclub ranking list for the year
// @route   GET /api/wrapped/:year/ranking-list
// @access  Private
exports.getRankingList = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const userId = req.user._id;

    const response = await getOrCreateResponse(userId, year);

    if (response.rankingListId) {
      const existing = await List.findById(response.rankingListId);
      if (existing) {
        return res.status(200).json({ success: true, list: existing });
      }
    }

    const bookclubBooks = await Book.find({ bookclubMonth: { $regex: String(year) } });

    const reviews = await Review.find({
      user: userId,
      book: { $in: bookclubBooks.map((b) => b._id) },
    });
    const ratingByBookId = new Map(reviews.map((r) => [r.book.toString(), r.rating]));

    const sorted = [...bookclubBooks].sort((a, b) => {
      const ra = ratingByBookId.get(a._id.toString());
      const rb = ratingByBookId.get(b._id.toString());
      if (ra === undefined && rb === undefined) return 0;
      if (ra === undefined) return 1;
      if (rb === undefined) return -1;
      return rb - ra;
    });

    const list = await List.create({
      title: `Bokklubben ${year} — din rangering`,
      description: "Automatisk opprettet for Bokwrapped",
      visibility: "private",
      owner: userId,
      books: sorted.map((book) => ({ book: book._id, addedBy: userId })),
    });

    response.rankingListId = list._id;
    await response.save();

    const populated = await List.findById(list._id);
    res.status(200).json({ success: true, list: populated });
  } catch (error) {
    console.error("Get wrapped ranking list error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente rangeringslisten" });
  }
};

// @desc    Mark the ranking step as done
// @route   PUT /api/wrapped/:year/ranking-done
// @access  Private
exports.markRankingDone = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const response = await getOrCreateResponse(req.user._id, year);
    response.stepsCompleted.ranking = true;
    await response.save();

    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error("Mark wrapped ranking done error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke oppdatere status" });
  }
};

// @desc    Save a draft of the Book Awards nominations
// @route   PUT /api/wrapped/:year/awards
// @access  Private
exports.saveAwards = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const response = await getOrCreateResponse(req.user._id, year);

    const allowedFields = [
      "bestBook",
      "worstBook",
      "mostTalkedAbout",
      "mostConfusing",
      "bestHateRead",
      "favoriteCharacter",
      "mostAnnoyingCharacter",
      "bestSideCharacter",
      "bestSpicyScene",
    ];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        response.awards[field] = req.body[field];
      }
    }
    await response.save();

    res.status(200).json({ success: true, message: "Kladd lagret", response });
  } catch (error) {
    console.error("Save wrapped awards error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke lagre kladden" });
  }
};

// @desc    Submit the Book Awards nominations (completes the collection flow)
// @route   POST /api/wrapped/:year/submit
// @access  Private
exports.submit = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const response = await getOrCreateResponse(req.user._id, year);
    response.stepsCompleted.awards = true;
    response.submittedAt = new Date();
    await response.save();

    res.status(200).json({ success: true, message: "Nominasjonene er sendt inn", response });
  } catch (error) {
    console.error("Submit wrapped error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke sende inn nominasjonene" });
  }
};

// @desc    Status summary for the homepage banner
// @route   GET /api/wrapped/:year/status
// @access  Private
exports.getStatus = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const response = await WrappedResponse.findOne({ user: req.user._id, year });

    const stepsCompleted = response?.stepsCompleted || {
      confirmList: false,
      ranking: false,
      awards: false,
    };
    const completedCount = Object.values(stepsCompleted).filter(Boolean).length;

    res.status(200).json({
      success: true,
      windowOpen: isWindowOpen(year),
      window: getWindow(year),
      stepsCompleted,
      completedCount,
      awards: response?.awards || {},
    });
  } catch (error) {
    console.error("Get wrapped status error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente status" });
  }
};
