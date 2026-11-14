const mongoose = require("mongoose");
const WrappedResponse = require("../models/WrappedResponse");
const WrappedQuestion = require("../models/WrappedQuestion");
const UserBook = require("../models/UserBook");
const Book = require("../models/Book");
const Review = require("../models/Review");
const List = require("../models/List");
const Setting = require("../models/Setting");
const User = require("../models/User");
const Meeting = require("../models/Meeting");
const WrappedShare = require("../models/WrappedShare");
const { DEFAULT_QUESTIONS } = require("../constants/defaultWrappedQuestions");
const { getVisibility, setVisibility } = require("../utils/featureVisibility");
const { getYearStats, liveSubset, buildAwardTally } = require("../utils/wrappedStats");
const { queueBadgeCheck } = require("../utils/badgeAwarder");

const windowSettingKey = (year) => `wrapped:${year}:window`;
const visibilitySettingKey = (year) => `wrapped:${year}:visibility`;
const releaseSettingKey = (year) => `wrapped:${year}:release`;

// Release day for the results: { at: ISO string, announced: bool }. No
// setting means "not scheduled yet" - results stay locked for members
// (admins can always preview). `announced` is flipped by the scheduler
// once the release notification has gone out (see wrappedRelease.js).
async function getRelease(year) {
  const setting = await Setting.findOne({ key: releaseSettingKey(year) });
  const at = setting?.value?.at ? new Date(setting.value.at) : null;
  return { at, released: !!at && at <= new Date(), announced: !!setting?.value?.announced };
}

// Books unticked in step 1 without a corrected date get parked on this
// fixed timestamp (Oslo time) so they're easy to find again in the database.
const PARKED_FINISHED_AT = new Date("2024-01-01T02:00:00+01:00");

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

async function getBookclubBooksForYear(year) {
  return Book.find({ bookclubMonth: { $regex: String(year) } });
}

// Admin manages questions per year from here on, but a year starts out with
// this default set the first time anyone needs it (member loading step 3,
// or admin opening the Bokwrapped tab) - same lazy-seed idea as the
// ranking list below.
async function getOrSeedQuestions(year) {
  const existing = await WrappedQuestion.find({ year }).sort({ order: 1 });
  if (existing.length > 0) return existing;

  await WrappedQuestion.insertMany(
    DEFAULT_QUESTIONS.map((q, index) => ({ ...q, year, order: index })),
  );
  return WrappedQuestion.find({ year }).sort({ order: 1 });
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

    // The member's own star ratings, so step 1 can ask for the missing ones
    const reviews = await Review.find({
      user: userId,
      book: { $in: candidates.map((ub) => ub.book?._id).filter(Boolean) },
    }).select("book rating");
    const ratingByBook = new Map(reviews.map((r) => [r.book.toString(), r.rating]));

    const books = candidates.map((ub) => ({
      userBookId: ub._id,
      book: ub.book,
      finishedAt: ub.finishedAt,
      flagged: !ub.finishedAt,
      checked: !excluded.has(ub.book?._id?.toString()),
      rating: ratingByBook.get(ub.book?._id?.toString()) ?? null,
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
    const { excludedBookIds, parkUserBookIds } = req.body;

    if (Array.isArray(parkUserBookIds) && parkUserBookIds.length > 0) {
      // Only touch the user's own read books that still belong to this year
      // (or have no date), so a stale request can't move anything else.
      const toPark = await UserBook.find({
        _id: { $in: parkUserBookIds },
        user: req.user._id,
        status: "read",
        $or: [
          { finishedAt: null },
          {
            finishedAt: {
              $gte: new Date(`${year}-01-01T00:00:00`),
              $lt: new Date(`${year + 1}-01-01T00:00:00`),
            },
          },
        ],
      });
      const ids = toPark.map((ub) => ub._id);
      const bookIds = toPark.map((ub) => ub.book?._id).filter(Boolean);
      await UserBook.updateMany(
        { _id: { $in: ids } },
        { $set: { finishedAt: PARKED_FINISHED_AT } },
        { timestamps: false }, // not new activity - keep them out of the feed
      );
      // Keep the review's readingDate in sync, same as updateFinishedDate does
      await Review.updateMany(
        { user: req.user._id, book: { $in: bookIds } },
        { $set: { readingDate: PARKED_FINISHED_AT } },
      );
    }

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

    const bookclubBooks = await getBookclubBooksForYear(year);

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

// @desc    This year's active Book Awards questions
// @route   GET /api/wrapped/:year/questions
// @access  Private
exports.getQuestions = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const all = await getOrSeedQuestions(year);
    res.status(200).json({ success: true, questions: all.filter((q) => q.active) });
  } catch (error) {
    console.error("Get wrapped questions error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente spørsmålene" });
  }
};

// @desc    This year's bookclub books (for the "book-bookclub" question type)
// @route   GET /api/wrapped/:year/bookclub-books
// @access  Private
exports.getBookclubBooks = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const books = await getBookclubBooksForYear(year);
    res.status(200).json({ success: true, books });
  } catch (error) {
    console.error("Get wrapped bookclub books error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente bokklubbøkene" });
  }
};

// @desc    Save a draft of the Book Awards answers
// @route   PUT /api/wrapped/:year/awards
// @access  Private
exports.saveAwards = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: "answers må være en liste" });
    }

    const questions = await WrappedQuestion.find({ year });
    const questionById = new Map(questions.map((q) => [q._id.toString(), q]));

    const response = await getOrCreateResponse(req.user._id, year);

    const saved = [];
    for (const entry of answers) {
      const question = questionById.get(String(entry.questionId));
      if (!question) continue;
      if (entry.value === undefined || entry.value === null || entry.value === "") continue;

      const answer = { question: question._id, textValue: null, numberValue: null, bookValue: null };

      if (question.type === "text") {
        answer.textValue = String(entry.value).trim();
      } else if (question.type === "number") {
        const num = Number(entry.value);
        if (Number.isNaN(num)) continue;
        answer.numberValue = num;
      } else {
        answer.bookValue = entry.value;
      }

      saved.push(answer);
    }

    response.answers = saved;
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
    queueBadgeCheck(req.user._id); // the year's Bokwrapped badge

    res.status(200).json({ success: true, message: "Nominasjonene er sendt inn", response });
  } catch (error) {
    console.error("Submit wrapped error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke sende inn nominasjonene" });
  }
};

// @desc    Status summary for the homepage banner + draft restore for step 3
// @route   GET /api/wrapped/:year/status
// @access  Private
exports.getStatus = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const response = await WrappedResponse.findOne({ user: req.user._id, year }).populate(
      "answers.bookValue",
      "title author",
    );

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
      answers: response?.answers || [],
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

// @desc    Admin: read this year's launch state ("open" to every member, or
//          "admin-only" while it's being prepared)
// @route   GET /api/wrapped/:year/admin/visibility
// @access  Private (admin only)
exports.getAdminVisibility = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const visibility = await getVisibility(visibilitySettingKey(year));
    res.status(200).json({ success: true, visibility });
  } catch (error) {
    console.error("Get wrapped admin visibility error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente synlighet" });
  }
};

// @desc    Admin: flip this year's launch state
// @route   PUT /api/wrapped/:year/admin/visibility
// @access  Private (admin only)
exports.setAdminVisibility = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const visibility = await setVisibility(visibilitySettingKey(year), req.body.visibility);
    res.status(200).json({ success: true, visibility });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Admin: list all of this year's questions (incl. inactive)
// @route   GET /api/wrapped/:year/admin/questions
// @access  Private (admin only)
exports.getAdminQuestions = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const questions = await getOrSeedQuestions(year);
    res.status(200).json({ success: true, questions });
  } catch (error) {
    console.error("Get admin wrapped questions error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente spørsmålene" });
  }
};

// @desc    Admin: create a new question
// @route   POST /api/wrapped/:year/admin/questions
// @access  Private (admin only)
exports.createQuestion = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const { label, type, helper } = req.body;

    if (!label || !label.trim()) {
      return res.status(400).json({ success: false, message: "Spørsmålet må ha en tekst" });
    }
    if (!["text", "number", "book-library", "book-bookclub"].includes(type)) {
      return res.status(400).json({ success: false, message: "Ugyldig svartype" });
    }

    const count = await WrappedQuestion.countDocuments({ year });
    const question = await WrappedQuestion.create({
      year,
      label: label.trim(),
      type,
      helper: helper || "",
      order: count,
    });

    res.status(201).json({ success: true, message: "Spørsmål lagt til", question });
  } catch (error) {
    console.error("Create wrapped question error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke legge til spørsmålet" });
  }
};

// @desc    Admin: update a question's label/type/helper/active
// @route   PUT /api/wrapped/:year/admin/questions/:id
// @access  Private (admin only)
exports.updateQuestion = async (req, res) => {
  try {
    const { label, type, helper, active } = req.body;
    const question = await WrappedQuestion.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Fant ikke spørsmålet" });
    }

    if (type !== undefined && !["text", "number", "book-library", "book-bookclub"].includes(type)) {
      return res.status(400).json({ success: false, message: "Ugyldig svartype" });
    }

    if (label !== undefined) question.label = label.trim();
    if (type !== undefined) question.type = type;
    if (helper !== undefined) question.helper = helper;
    if (active !== undefined) question.active = active;
    await question.save();

    res.status(200).json({ success: true, message: "Spørsmål oppdatert", question });
  } catch (error) {
    console.error("Update wrapped question error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke oppdatere spørsmålet" });
  }
};

// @desc    Admin: delete a question
// @route   DELETE /api/wrapped/:year/admin/questions/:id
// @access  Private (admin only)
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await WrappedQuestion.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Fant ikke spørsmålet" });
    }
    res.status(200).json({ success: true, message: "Spørsmål slettet" });
  } catch (error) {
    console.error("Delete wrapped question error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke slette spørsmålet" });
  }
};

// @desc    Admin: reorder this year's questions
// @route   PUT /api/wrapped/:year/admin/questions/reorder
// @access  Private (admin only)
exports.reorderQuestions = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const { orderedQuestionIds } = req.body;
    if (!Array.isArray(orderedQuestionIds)) {
      return res.status(400).json({ success: false, message: "orderedQuestionIds må være en liste" });
    }

    await Promise.all(
      orderedQuestionIds.map((id, index) =>
        WrappedQuestion.findOneAndUpdate({ _id: id, year }, { order: index }),
      ),
    );

    const questions = await WrappedQuestion.find({ year }).sort({ order: 1 });
    res.status(200).json({ success: true, questions });
  } catch (error) {
    console.error("Reorder wrapped questions error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke lagre rekkefølgen" });
  }
};

// @desc    Admin: tally the Book Awards nominations for a year
// @route   GET /api/wrapped/:year/admin/tally
// @access  Private (admin only)
exports.getAdminTally = async (req, res) => {
  try {
    const year = Number(req.params.year);

    const [{ questions, tally, submittedCount }, totalMembers] = await Promise.all([
      buildAwardTally(year),
      User.countDocuments({ status: "approved" }),
    ]);

    res.status(200).json({ success: true, submittedCount, totalMembers, questions, tally });
  } catch (error) {
    console.error("Get wrapped admin tally error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke telle opp nominasjonene" });
  }
};

// @desc    Release date for a year's results (drives the countdown)
// @route   GET /api/wrapped/:year/release
// @access  Private
exports.getReleaseInfo = async (req, res) => {
  try {
    const { at, released } = await getRelease(Number(req.params.year));
    res.status(200).json({ success: true, releaseAt: at, released });
  } catch (error) {
    console.error("Get wrapped release error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente slippdatoen" });
  }
};

// @desc    The member's reading year so far - available all year round
// @route   GET /api/wrapped/:year/live
// @access  Private
exports.getLiveStats = async (req, res) => {
  try {
    // Always fresh: members check this right after correcting dates/ratings
    const { perUser } = await getYearStats(Number(req.params.year), { fresh: true });
    const mine = perUser.get(req.user._id.toString());
    res.status(200).json({ success: true, stats: mine ? liveSubset(mine) : null });
  } catch (error) {
    console.error("Get wrapped live stats error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente leseåret ditt" });
  }
};

// @desc    The full Bokwrapped results (personal + club) - locked until release day
// @route   GET /api/wrapped/:year/results
// @access  Private (admins can preview before release)
exports.getResults = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const release = await getRelease(year);
    const isAdmin = req.user.role === "admin";

    if (!release.released && !isAdmin) {
      return res.status(403).json({
        success: false,
        released: false,
        releaseAt: release.at,
        message: "Bokwrapped er ikke sluppet ennå",
      });
    }

    const { perUser, club } = await getYearStats(year);
    // An admin may preview someone else's wrapped to check it before release
    const userId = isAdmin && req.query.user ? String(req.query.user) : req.user._id.toString();
    const shared = !!(await WrappedShare.exists({ user: userId, year }));

    res.status(200).json({
      success: true,
      year,
      released: release.released,
      releaseAt: release.at,
      personal: perUser.get(userId) || null,
      club,
      shared,
    });
  } catch (error) {
    console.error("Get wrapped results error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente Bokwrapped" });
  }
};

// @desc    Admin: get the results release date
// @route   GET /api/wrapped/:year/admin/release
// @access  Private (admin only)
exports.getAdminRelease = async (req, res) => {
  try {
    const release = await getRelease(Number(req.params.year));
    res.status(200).json({ success: true, ...release });
  } catch (error) {
    console.error("Get wrapped admin release error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente slippdatoen" });
  }
};

// @desc    Admin: set (or clear) the results release date
// @route   PUT /api/wrapped/:year/admin/release
// @access  Private (admin only)
exports.setAdminRelease = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const { at } = req.body;

    if (!at) {
      await Setting.deleteOne({ key: releaseSettingKey(year) });
      return res.status(200).json({ success: true, at: null, released: false, announced: false });
    }

    const date = new Date(at);
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ success: false, message: "Ugyldig dato" });
    }

    // Moving the date resets the announcement, unless it already went out
    // for a release that has passed (so it isn't sent twice).
    const current = await getRelease(year);
    const announced = current.announced && date <= new Date();

    await Setting.findOneAndUpdate(
      { key: releaseSettingKey(year) },
      { key: releaseSettingKey(year), value: { at: date.toISOString(), announced } },
      { upsert: true },
    );

    res.status(200).json({ success: true, ...(await getRelease(year)) });
  } catch (error) {
    console.error("Set wrapped admin release error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke lagre slippdatoen" });
  }
};

// @desc    Admin: list of members, for previewing someone else's results
// @route   GET /api/wrapped/:year/admin/members
// @access  Private (admin only)
exports.getAdminMembers = async (req, res) => {
  try {
    const { perUser } = await getYearStats(Number(req.params.year));
    const members = [...perUser.values()]
      .map((s) => ({ ...s.user, count: s.count }))
      .sort((a, b) => (a.displayName || a.username).localeCompare(b.displayName || b.username));
    res.status(200).json({ success: true, members });
  } catch (error) {
    console.error("Get wrapped admin members error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente medlemmene" });
  }
};

// @desc    Quick star rating from step 1 - creates a star-only review (kept
//          out of the feed) or updates the rating on an existing one
// @route   PUT /api/wrapped/:year/rating
// @access  Private
exports.setQuickRating = async (req, res) => {
  try {
    const { bookId, rating } = req.body;
    const value = Number(rating);
    if (!bookId || Number.isNaN(value)) {
      return res.status(400).json({ success: false, message: "Mangler bok eller vurdering" });
    }

    // Only books the member has actually marked as read
    const userBook = await UserBook.findOne({ user: req.user._id, book: bookId, status: "read" });
    if (!userBook) {
      return res.status(404).json({ success: false, message: "Fant ikke boka i leselisten din" });
    }

    let review = await Review.findOne({ user: req.user._id, book: bookId });
    if (review) {
      review.rating = value;
    } else {
      review = new Review({
        book: bookId,
        user: req.user._id,
        rating: value,
        readingDate: userBook.finishedAt,
        hideFromFeed: true,
      });
    }
    await review.save(); // post-save hook refreshes the book's average
    queueBadgeCheck(req.user._id);

    res.status(200).json({ success: true, rating: review.rating });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    console.error("Set wrapped quick rating error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke lagre vurderingen" });
  }
};

// The year's meetings that have happened (not cancelled, not in the future)
async function getYearMeetings(year) {
  return Meeting.find({
    date: { $gte: new Date(`${year}-01-01T00:00:00`), $lt: new Date(`${year + 1}-01-01T00:00:00`), $lte: new Date() },
    status: { $ne: "cancelled" },
  })
    .select("title date book attendees")
    .sort({ date: 1 })
    .lean();
}

// @desc    The year's meetings, with what the member said they attended
//          (or their RSVPs as a starting point)
// @route   GET /api/wrapped/:year/meetings
// @access  Private
exports.getMeetings = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const userId = req.user._id.toString();
    const [meetings, response] = await Promise.all([
      getYearMeetings(year),
      WrappedResponse.findOne({ user: req.user._id, year }).select("attendedMeetingIds attendanceConfirmed"),
    ]);
    const confirmed = new Set((response?.attendedMeetingIds || []).map((id) => id.toString()));

    res.status(200).json({
      success: true,
      confirmed: !!response?.attendanceConfirmed,
      meetings: meetings.map((m) => {
        const rsvp = (m.attendees || []).some((a) => String(a?._id || a) === userId);
        return {
          _id: m._id,
          title: m.title,
          date: m.date,
          book: m.book ? { _id: m.book._id, title: m.book.title } : null,
          rsvp,
          attended: response?.attendanceConfirmed ? confirmed.has(m._id.toString()) : rsvp,
        };
      }),
    });
  } catch (error) {
    console.error("Get wrapped meetings error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente møtene" });
  }
};

// @desc    Save which of the year's meetings the member actually attended
// @route   PUT /api/wrapped/:year/meetings
// @access  Private
exports.saveMeetings = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const ids = Array.isArray(req.body.attendedMeetingIds) ? req.body.attendedMeetingIds.map(String) : [];
    // Only keep ids of this year's meetings
    const valid = new Set((await getYearMeetings(year)).map((m) => m._id.toString()));

    const response = await getOrCreateResponse(req.user._id, year);
    response.attendedMeetingIds = ids.filter((id) => valid.has(id));
    response.attendanceConfirmed = true;
    await response.save();

    res.status(200).json({ success: true, attended: response.attendedMeetingIds.length });
  } catch (error) {
    console.error("Save wrapped meetings error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke lagre møtene" });
  }
};

// ---------------------------------------------------------------- Sharing

const SHARE_USER_FIELDS = "displayName username avatar";
const SHARE_FAVORITES = 3;

// The member's favourites: highest own rating first (stable, so ties keep
// reading order), topped up with unrated books if fewer than 3 are rated.
// Mirrored in the frontend's previewSnapshot (ShareWithClubSlide.jsx).
function favoriteBooks(books) {
  const rated = books.filter((b) => b.rating != null).sort((a, b) => b.rating - a.rating);
  const unrated = books.filter((b) => b.rating == null);
  return [...rated, ...unrated].slice(0, SHARE_FAVORITES).map((b) => ({
    bookId: b._id,
    title: b.title,
    coverImage: b.coverImage || null,
    rating: b.rating ?? null,
  }));
}

// The mini card's contents, from the same stats the results story shows
function shareSnapshot(personal) {
  const best = personal.bestPercentile;
  return {
    count: personal.count,
    pages: personal.pages,
    avgRating: personal.avgRating,
    topGenre: personal.topGenres?.[0]?.name || null,
    personalities: (personal.personalities || []).map(({ key, label, emoji }) => ({ key, label, emoji })),
    favorites: favoriteBooks(personal.books),
    bestPercentile: best?.topPercent ? { topPercent: best.topPercent, label: best.label } : null,
    readingGoal: personal.readingGoal ? { goal: personal.readingGoal, count: personal.count } : null,
    bookclub:
      personal.bookclub?.total > 0
        ? {
            read: personal.bookclub.read,
            total: personal.bookclub.total,
            meetingsAttended: personal.meetings?.attended || 0,
            meetingsTotal: personal.meetings?.total || 0,
          }
        : null,
  };
}

// Before release only admins see shared cards (their own preview share) -
// members get nothing until release day, so nothing leaks early.
const sharesVisibleTo = (req, released) => released || req.user.role === "admin";

// @desc    Share my Bokwrapped summary with the club (profile + homepage)
// @route   POST /api/wrapped/:year/share
// @access  Private (after release; admins any time, to preview the look)
exports.shareResults = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const release = await getRelease(year);
    if (!sharesVisibleTo(req, release.released)) {
      return res.status(403).json({ success: false, message: "Bokwrapped er ikke sluppet ennå" });
    }

    // Same (briefly cached) stats the member just saw in the story
    const { perUser } = await getYearStats(year);
    const personal = perUser.get(req.user._id.toString());
    if (!personal || personal.count === 0) {
      return res.status(400).json({ success: false, message: "Du har ingen leste bøker å dele for dette året" });
    }

    const share = await WrappedShare.findOneAndUpdate(
      { user: req.user._id, year },
      { $set: { snapshot: shareSnapshot(personal) } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).populate("user", SHARE_USER_FIELDS);

    res.status(200).json({ success: true, share: { ...share.toObject(), released: release.released } });
  } catch (error) {
    console.error("Share wrapped error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke dele Bokwrapped" });
  }
};

// @desc    Stop sharing my Bokwrapped summary
// @route   DELETE /api/wrapped/:year/share
// @access  Private
exports.unshareResults = async (req, res) => {
  try {
    await WrappedShare.deleteOne({ user: req.user._id, year: Number(req.params.year) });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Unshare wrapped error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke fjerne delingen" });
  }
};

// @desc    Every member's shared summary for a year - homepage row
// @route   GET /api/wrapped/:year/shares
// @access  Private
exports.getYearShares = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const { released } = await getRelease(year);
    if (!sharesVisibleTo(req, released)) {
      return res.status(200).json({ success: true, released, shares: [] });
    }
    const shares = await WrappedShare.find({ year })
      .sort({ createdAt: -1 })
      .populate("user", SHARE_USER_FIELDS);
    // A deleted member's share has no user left to show
    res.status(200).json({ success: true, released, shares: shares.filter((s) => s.user) });
  } catch (error) {
    console.error("Get wrapped shares error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente delte Bokwrapped" });
  }
};

// @desc    One member's shared summaries, newest year first - profile
// @route   GET /api/wrapped/shares/user/:userId
// @access  Private
exports.getUserShares = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.userId)) {
      return res.status(400).json({ success: false, message: "Ugyldig bruker" });
    }
    const shares = await WrappedShare.find({ user: req.params.userId })
      .sort({ year: -1 })
      .populate("user", SHARE_USER_FIELDS);
    const releasedByYear = new Map();
    for (const year of new Set(shares.map((s) => s.year))) {
      releasedByYear.set(year, (await getRelease(year)).released);
    }
    res.status(200).json({
      success: true,
      shares: shares
        .filter((s) => s.user && sharesVisibleTo(req, releasedByYear.get(s.year)))
        .map((s) => ({ ...s.toObject(), released: releasedByYear.get(s.year) })),
    });
  } catch (error) {
    console.error("Get user wrapped shares error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente delte Bokwrapped" });
  }
};
