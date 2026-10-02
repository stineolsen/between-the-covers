const WrappedResponse = require("../models/WrappedResponse");
const UserBook = require("../models/UserBook");
const Book = require("../models/Book");
const Review = require("../models/Review");
const List = require("../models/List");
const Setting = require("../models/Setting");
const User = require("../models/User");
const { AWARD_FIELDS } = require("../constants/wrappedAwardFields");

const windowSettingKey = (year) => `wrapped:${year}:window`;

// December collection window for a given wrapped year - 1st through the
// 27th by default (admin needs the rest of the holidays to generate the
// actual wrapped), but adjustable per year via the Setting model, same
// pattern as the Calibre "import since" date in importController.js.
async function getWindow(year) {
  const setting = await Setting.findOne({ key: windowSettingKey(year) });
  if (setting?.value?.start && setting?.value?.end) {
    return {
      start: new Date(`${setting.value.start}T00:00:00`),
      end: new Date(`${setting.value.end}T23:59:59`),
    };
  }
  return {
    start: new Date(`${year}-12-01T00:00:00`),
    end: new Date(`${year}-12-27T23:59:59`),
  };
}

async function isWindowOpen(year) {
  const { start, end } = await getWindow(year);
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
      windowOpen: await isWindowOpen(year),
      window: await getWindow(year),
      stepsCompleted,
      completedCount,
      awards: response?.awards || {},
    });
  } catch (error) {
    console.error("Get wrapped status error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente status" });
  }
};

// @desc    Admin: get the collection window for a year
// @route   GET /api/wrapped/:year/admin/window
// @access  Private (admin only)
exports.getAdminWindow = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const setting = await Setting.findOne({ key: windowSettingKey(year) });
    const { start, end } = await getWindow(year);

    res.status(200).json({
      success: true,
      start: setting?.value?.start || start.toISOString().slice(0, 10),
      end: setting?.value?.end || end.toISOString().slice(0, 10),
      isDefault: !setting,
    });
  } catch (error) {
    console.error("Get wrapped admin window error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente innsamlingsvinduet" });
  }
};

// @desc    Admin: set the collection window for a year
// @route   PUT /api/wrapped/:year/admin/window
// @access  Private (admin only)
exports.setAdminWindow = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const { start, end } = req.body;

    if (!start || !end) {
      return res.status(400).json({ success: false, message: "Start- og sluttdato er påkrevd" });
    }

    await Setting.findOneAndUpdate(
      { key: windowSettingKey(year) },
      { value: { start, end } },
      { upsert: true },
    );

    res.status(200).json({ success: true, message: "Innsamlingsvinduet er oppdatert", start, end });
  } catch (error) {
    console.error("Set wrapped admin window error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke lagre innsamlingsvinduet" });
  }
};

// @desc    Admin: tally the Book Awards nominations for a year
// @route   GET /api/wrapped/:year/admin/tally
// @access  Private (admin only)
exports.getAdminTally = async (req, res) => {
  try {
    const year = Number(req.params.year);

    const [responses, totalMembers] = await Promise.all([
      WrappedResponse.find({ year }).populate("user", "displayName username"),
      User.countDocuments({ status: "approved" }),
    ]);

    const submittedCount = responses.filter((r) => r.stepsCompleted?.awards).length;

    const tally = {};
    for (const field of AWARD_FIELDS) {
      const groups = new Map(); // normalized text -> { text, count, respondents }

      for (const response of responses) {
        const raw = (response.awards?.[field.key] || "").trim();
        if (!raw) continue;

        const normalized = raw.toLowerCase().replace(/\s+/g, " ");
        const respondentName = response.user?.displayName || response.user?.username || "Ukjent";

        if (!groups.has(normalized)) {
          groups.set(normalized, { text: raw, count: 0, respondents: [] });
        }
        const group = groups.get(normalized);
        group.count += 1;
        group.respondents.push(respondentName);
      }

      tally[field.key] = [...groups.values()].sort((a, b) => b.count - a.count);
    }

    res.status(200).json({ success: true, submittedCount, totalMembers, tally });
  } catch (error) {
    console.error("Get wrapped admin tally error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke telle opp nominasjonene" });
  }
};
