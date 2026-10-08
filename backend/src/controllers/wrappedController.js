const WrappedResponse = require("../models/WrappedResponse");
const WrappedQuestion = require("../models/WrappedQuestion");
const UserBook = require("../models/UserBook");
const Book = require("../models/Book");
const Review = require("../models/Review");
const List = require("../models/List");
const Setting = require("../models/Setting");
const User = require("../models/User");
const { DEFAULT_QUESTIONS } = require("../constants/defaultWrappedQuestions");
const { getVisibility, setVisibility } = require("../utils/featureVisibility");

const windowSettingKey = (year) => `wrapped:${year}:window`;
const visibilitySettingKey = (year) => `wrapped:${year}:visibility`;

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

    const [questions, responses, totalMembers] = await Promise.all([
      WrappedQuestion.find({ year }).sort({ order: 1 }),
      WrappedResponse.find({ year })
        .populate("user", "displayName username")
        .populate("answers.bookValue", "title author"),
      User.countDocuments({ status: "approved" }),
    ]);

    const submittedCount = responses.filter((r) => r.stepsCompleted?.awards).length;

    const tally = {};
    for (const question of questions) {
      const groups = new Map();

      for (const response of responses) {
        const answer = response.answers.find(
          (a) => a.question.toString() === question._id.toString(),
        );
        if (!answer) continue;

        const respondentName = response.user?.displayName || response.user?.username || "Ukjent";
        let groupKey;
        let displayText;

        if (question.type === "text") {
          if (!answer.textValue) continue;
          groupKey = answer.textValue.toLowerCase().replace(/\s+/g, " ");
          displayText = answer.textValue;
        } else if (question.type === "number") {
          if (answer.numberValue === null || answer.numberValue === undefined) continue;
          groupKey = String(answer.numberValue);
          displayText = String(answer.numberValue);
        } else {
          if (!answer.bookValue) continue;
          groupKey = answer.bookValue._id
            ? answer.bookValue._id.toString()
            : answer.bookValue.toString();
          displayText = answer.bookValue.title
            ? `${answer.bookValue.title} — ${answer.bookValue.author}`
            : "Ukjent bok";
        }

        if (!groups.has(groupKey)) {
          groups.set(groupKey, { text: displayText, count: 0, respondents: [] });
        }
        const group = groups.get(groupKey);
        group.count += 1;
        group.respondents.push(respondentName);
      }

      tally[question._id.toString()] = [...groups.values()].sort((a, b) => b.count - a.count);
    }

    res.status(200).json({ success: true, submittedCount, totalMembers, questions, tally });
  } catch (error) {
    console.error("Get wrapped admin tally error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke telle opp nominasjonene" });
  }
};
