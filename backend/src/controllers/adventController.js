const AdventDay = require("../models/AdventDay");
const AdventAttempt = require("../models/AdventAttempt");
const AdventResult = require("../models/AdventResult");
const Book = require("../models/Book");
const fs = require("fs");
const path = require("path");
const { now, doorOpensAt, doorDeadline } = require("../utils/calendarClock");
const { ADVENT_IMAGE_ROOT } = require("../utils/adventPaths");
const { publishDoorToLibraryIfDue, sweepDueDoors } = require("../utils/adventLibraryPublish");
const { awardDoorCountBadgesForUser, recalculateDoorCountBadgesForYear } = require("../utils/badgeAwarder");
const { normalizeTitle, normalizeAuthor } = require("../utils/importHelpers");
const { processAdventCover } = require("../utils/adventImagePipeline");
const { getVisibility, setVisibility } = require("../utils/featureVisibility");
const { MAX_ATTEMPTS, POINTS_BY_ATTEMPT, LEADERBOARD_DEADLINE_DAYS_AFTER_OPEN } = require("../constants/adventConfig");

const visibilityKey = (year) => `advent:${year}:visibility`;

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function calendarEntry(door, result) {
  const opensAt = doorOpensAt(door.year, door.day);
  if (now() < opensAt) {
    return { day: door.day, state: "locked", opensAt };
  }

  const deadline = doorDeadline(door.year, door.day, LEADERBOARD_DEADLINE_DAYS_AFTER_OPEN);
  const deadlinePassed = now() >= deadline;

  if (result?.status === "solved") {
    return { day: door.day, state: "solved", points: result.points, countsForLeaderboard: result.countsForLeaderboard };
  }
  if (result?.status === "failed") {
    return { day: door.day, state: "failed", points: 0 };
  }
  if (deadlinePassed) {
    return { day: door.day, state: "expired", attemptsUsed: result?.attemptsUsed || 0 };
  }
  return { day: door.day, state: "open", attemptsUsed: result?.attemptsUsed || 0, deadline };
}

// @desc    Calendar overview for a year, with per-door state for the caller
// @route   GET /api/advent/:year
// @access  Private
exports.getCalendar = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const doors = await AdventDay.find({ year }).sort({ day: 1 });
    const results = await AdventResult.find({
      user: req.user._id,
      adventDay: { $in: doors.map((d) => d._id) },
    });
    const resultByDoor = new Map(results.map((r) => [r.adventDay.toString(), r]));

    const days = doors.map((door) => calendarEntry(door, resultByDoor.get(door._id.toString())));
    res.status(200).json({ success: true, year, days });
  } catch (error) {
    console.error("Advent calendar error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente kalenderen" });
  }
};

// @desc    One door's detail - only what the caller has earned the right to see
// @route   GET /api/advent/:year/:day
// @access  Private
exports.getDay = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const day = Number(req.params.day);
    const door = await AdventDay.findOne({ year, day });
    if (!door) return res.status(404).json({ success: false, message: "Luke finnes ikke" });
    if (now() < doorOpensAt(year, day)) {
      return res.status(404).json({ success: false, message: "Luken er ikke åpnet ennå" });
    }

    // Lazy publish: first request after the deadline flips this door's book
    // visible in the library. Never fails the request if it can't run.
    publishDoorToLibraryIfDue(door).catch((err) => console.error("Advent lazy publish failed:", err));

    let result = await AdventResult.findOne({ user: req.user._id, adventDay: door._id });
    if (!result) {
      result = await AdventResult.create({ user: req.user._id, adventDay: door._id, openedAt: now() });
    }
    const attempts = await AdventAttempt.find({ user: req.user._id, adventDay: door._id }).sort({ attemptNo: 1 });

    const deadline = doorDeadline(year, day, LEADERBOARD_DEADLINE_DAYS_AFTER_OPEN);
    const deadlinePassed = now() >= deadline;
    const finished = result.status !== "in_progress";
    const revealed = finished || deadlinePassed;

    const attemptsUsed = attempts.length;
    const currentAttemptNum = Math.min(attemptsUsed + 1, MAX_ATTEMPTS);
    const hintsVisible = revealed ? 3 : Math.min(currentAttemptNum - 1, 3);
    const imageLevel = revealed ? "final" : currentAttemptNum;

    const payload = {
      success: true,
      year,
      day,
      status: result.status,
      points: result.points,
      attemptsUsed,
      attemptsRemaining: MAX_ATTEMPTS - attemptsUsed,
      deadline,
      deadlinePassed,
      countsForLeaderboard: result.countsForLeaderboard,
      genre: door.genre,
      publishedYear: door.publishedYear,
      pageCount: door.pageCount,
      hints: [door.hint1, door.hint2, door.hint3].slice(0, hintsVisible),
      attempts: attempts.map((a) => ({ attemptNo: a.attemptNo, action: a.action, result: a.result })),
      imageLevel,
    };
    if (revealed) {
      payload.title = door.title;
      payload.author = door.author;
      payload.isbn = door.isbn;
      payload.libraryAvailable = !!door.publishedToLibraryAt;
      payload.libraryBookId = door.publishedToLibraryAt ? door.answerBookId : null;
    }
    res.status(200).json(payload);
  } catch (error) {
    console.error("Advent day error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente luken" });
  }
};

// @desc    Serve a door's cover image at the level the caller has unlocked -
//          never trusts the requested level, recomputes it server-side.
// @route   GET /api/advent/:year/:day/image/:level
// @access  Private
exports.getDayImage = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const day = Number(req.params.day);
    const door = await AdventDay.findOne({ year, day });
    if (!door) return res.sendStatus(404);
    if (now() < doorOpensAt(year, day)) return res.sendStatus(404);

    const [result, attemptsUsed] = await Promise.all([
      AdventResult.findOne({ user: req.user._id, adventDay: door._id }),
      AdventAttempt.countDocuments({ user: req.user._id, adventDay: door._id }),
    ]);

    const deadline = doorDeadline(year, day, LEADERBOARD_DEADLINE_DAYS_AFTER_OPEN);
    const deadlinePassed = now() >= deadline;
    const finished = result && result.status !== "in_progress";
    const revealed = finished || deadlinePassed;
    const currentAttemptNum = Math.min(attemptsUsed + 1, MAX_ATTEMPTS);

    const requestedLevel = req.params.level === "final" ? "final" : Number(req.params.level);
    const allowed =
      revealed ||
      (Number.isInteger(requestedLevel) && requestedLevel >= 1 && requestedLevel <= currentAttemptNum);
    if (!allowed) return res.sendStatus(403);

    const key = requestedLevel === "final" ? door.imageOriginalKey : door[`imageLevel${requestedLevel}Key`];
    if (!key) return res.sendStatus(404);

    const filePath = path.join(ADVENT_IMAGE_ROOT, key);
    if (!filePath.startsWith(ADVENT_IMAGE_ROOT) || !fs.existsSync(filePath)) return res.sendStatus(404);
    res.sendFile(filePath);
  } catch (error) {
    console.error("Advent image error:", error);
    res.sendStatus(500);
  }
};

// @desc    Guess or skip - the only endpoint that advances a door's state
// @route   POST /api/advent/:year/:day/attempt
// @access  Private (rate-limited)
exports.submitAttempt = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const day = Number(req.params.day);
    const { action, bookId } = req.body;

    if (!["guess", "skip"].includes(action)) {
      return res.status(400).json({ success: false, message: "Ugyldig handling" });
    }
    if (action === "guess" && !bookId) {
      return res.status(400).json({ success: false, message: "Mangler bok-id" });
    }

    const door = await AdventDay.findOne({ year, day });
    if (!door) return res.status(404).json({ success: false, message: "Luke finnes ikke" });
    if (now() < doorOpensAt(year, day)) {
      return res.status(404).json({ success: false, message: "Luken er ikke åpnet ennå" });
    }

    let result = await AdventResult.findOne({ user: req.user._id, adventDay: door._id });
    if (!result) {
      result = await AdventResult.create({ user: req.user._id, adventDay: door._id, openedAt: now() });
    }
    if (result.status !== "in_progress") {
      return res.status(400).json({ success: false, message: "Denne luken er allerede ferdigspilt" });
    }

    const attemptsUsed = await AdventAttempt.countDocuments({ user: req.user._id, adventDay: door._id });
    if (attemptsUsed >= MAX_ATTEMPTS) {
      return res.status(400).json({ success: false, message: "Ingen forsøk igjen" });
    }
    const attemptNo = attemptsUsed + 1;

    let outcome = "wrong";
    let guessedBook = null;
    if (action === "guess") {
      guessedBook = await Book.findById(bookId).select("_id author");
      if (!guessedBook) return res.status(400).json({ success: false, message: "Fant ikke boken" });
      if (guessedBook._id.equals(door.answerBookId)) {
        outcome = "correct";
      } else if (normalizeAuthor(guessedBook.author) === normalizeAuthor(door.author)) {
        outcome = "author";
      }
    }

    try {
      await AdventAttempt.create({
        user: req.user._id,
        adventDay: door._id,
        attemptNo,
        action,
        guessedBook: guessedBook?._id || null,
        result: outcome,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ success: false, message: "Forsøket ble allerede registrert" });
      }
      throw error;
    }

    const deadline = doorDeadline(year, day, LEADERBOARD_DEADLINE_DAYS_AFTER_OPEN);
    const withinDeadline = now() <= deadline;
    let finished = false;

    if (outcome === "correct") {
      result.status = "solved";
      result.points = withinDeadline ? POINTS_BY_ATTEMPT[attemptNo] : 0;
      result.finishedAt = now();
      result.countsForLeaderboard = withinDeadline;
      finished = true;
    } else if (attemptNo >= MAX_ATTEMPTS) {
      result.status = "failed";
      result.points = 0;
      result.finishedAt = now();
      result.countsForLeaderboard = withinDeadline;
      finished = true;
    }
    result.attemptsUsed = attemptNo;
    await result.save();

    if (finished && result.status === "solved") {
      awardDoorCountBadgesForUser(req.user._id, year).catch((err) =>
        console.error("Advent badge award failed:", err),
      );
    }

    const payload = {
      success: true,
      result: outcome,
      attemptsUsed: attemptNo,
      attemptsRemaining: MAX_ATTEMPTS - attemptNo,
      finished,
      status: result.status,
      points: result.points,
    };
    if (finished) {
      payload.title = door.title;
      payload.author = door.author;
    }
    res.status(200).json(payload);
  } catch (error) {
    console.error("Advent attempt error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke registrere forsøket" });
  }
};

// @desc    Guess-search - the pool is the whole library plus every advent
//          candidate (hidden ones included), so the suggestion list never
//          narrows down to just the answers.
// @route   GET /api/advent/search?q=
// @access  Private
exports.searchCandidates = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.status(200).json({ success: true, results: [] });

    const regex = new RegExp(escapeRegex(q), "i");
    const [bookMatches, altTitleDoors] = await Promise.all([
      Book.find({ $or: [{ title: regex }, { author: regex }] })
        .select("_id title author")
        .limit(8),
      AdventDay.find({ altTitles: regex }).select("answerBookId").limit(8),
    ]);

    const resultsById = new Map(bookMatches.map((b) => [b._id.toString(), b]));
    if (altTitleDoors.length > 0) {
      const extraBooks = await Book.find({ _id: { $in: altTitleDoors.map((d) => d.answerBookId) } }).select(
        "_id title author",
      );
      extraBooks.forEach((b) => resultsById.set(b._id.toString(), b));
    }

    const results = Array.from(resultsById.values())
      .slice(0, 8)
      .map((b) => ({ _id: b._id, title: b.title, author: b.author }));
    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error("Advent search error:", error);
    res.status(500).json({ success: false, message: "Søket feilet" });
  }
};

// @desc    Leaderboard - solved-within-deadline doors only
// @route   GET /api/advent/:year/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const doorIds = await AdventDay.find({ year }).distinct("_id");
    const results = await AdventResult.find({
      adventDay: { $in: doorIds },
      status: "solved",
      countsForLeaderboard: true,
    }).populate("user", "displayName username avatar");

    const byUser = new Map();
    for (const r of results) {
      if (!r.user) continue;
      const key = r.user._id.toString();
      if (!byUser.has(key)) byUser.set(key, { user: r.user, points: 0, solved: 0, totalMs: 0 });
      const entry = byUser.get(key);
      entry.points += r.points;
      entry.solved += 1;
      if (r.openedAt && r.finishedAt) entry.totalMs += r.finishedAt.getTime() - r.openedAt.getTime();
    }

    const leaderboard = Array.from(byUser.values())
      .sort((a, b) => b.points - a.points || b.solved - a.solved || a.totalMs - b.totalMs)
      .map((e, i) => ({
        rank: i + 1,
        user: { _id: e.user._id, displayName: e.user.displayName, username: e.user.username, avatar: e.user.avatar },
        points: e.points,
        solved: e.solved,
        totalMs: e.totalMs,
      }));

    res.status(200).json({ success: true, year, leaderboard });
  } catch (error) {
    console.error("Advent leaderboard error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente resultatlisten" });
  }
};

// ---------------- Admin ----------------

// @desc    Full, unredacted door list for admin review/editing
// @route   GET /api/advent/:year/admin
// @access  Private/Admin
exports.adminListDays = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const days = await AdventDay.find({ year }).sort({ day: 1 });
    res.status(200).json({ success: true, year, days });
  } catch (error) {
    console.error("Advent admin list error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente luker" });
  }
};

// @desc    Create a new door. Pass bookId to link an existing library book
//          as the answer (left exactly as-is, visible or not - we never
//          retroactively hide a book that's already public); omit it to
//          find-or-create a hidden candidate Book from title/author, same
//          match-by-normalized-title+author logic as seedAdventCalendar.js.
// @route   POST /api/advent/:year/:day/admin
// @access  Private/Admin
exports.adminCreateDay = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const day = Number(req.params.day);
    if (!day || day < 1 || day > 24) {
      return res.status(400).json({ success: false, message: "Luke må være mellom 1 og 24" });
    }

    const existing = await AdventDay.findOne({ year, day });
    if (existing) {
      return res.status(409).json({ success: false, message: `Luke ${day} finnes allerede for ${year}` });
    }

    const { title, author, altTitles, isbn, publishedYear, pageCount, genre, hint1, hint2, hint3, bookId } = req.body;
    if (!title?.trim() || !author?.trim() || !genre?.trim()) {
      return res.status(400).json({ success: false, message: "Tittel, forfatter og sjanger er påkrevd" });
    }

    let answerBookId = bookId || null;
    if (answerBookId) {
      const book = await Book.findById(answerBookId);
      if (!book) return res.status(400).json({ success: false, message: "Fant ikke valgt bok" });
    } else {
      const titleNormalized = normalizeTitle(title);
      const authorNormalized = normalizeAuthor(author);
      let book = await Book.findOne({ titleNormalized, authorNormalized });
      if (!book) {
        book = await Book.create({
          title: title.trim(),
          author: author.trim(),
          isbn: isbn || undefined,
          publishedYear: publishedYear || undefined,
          genres: genre ? [genre] : [],
          hiddenFromLibrary: true,
          addedBy: req.user._id,
        });
      }
      answerBookId = book._id;
    }

    const door = await AdventDay.create({
      year,
      day,
      title: title.trim(),
      author: author.trim(),
      altTitles: Array.isArray(altTitles) ? altTitles : [],
      isbn: isbn || null,
      publishedYear: publishedYear || null,
      pageCount: pageCount || null,
      genre: genre.trim(),
      hint1: hint1 || "",
      hint2: hint2 || "",
      hint3: hint3 || "",
      answerBookId,
    });

    res.status(201).json({ success: true, door });
  } catch (error) {
    console.error("Advent admin create error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke opprette luken" });
  }
};

// @desc    Delete a door - also clears attempts/results tied to it (its
//          generated images are removed too) but never touches the
//          answerBookId Book itself, published or not.
// @route   DELETE /api/advent/:year/:day/admin
// @access  Private/Admin
exports.adminDeleteDay = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const day = Number(req.params.day);
    const door = await AdventDay.findOne({ year, day });
    if (!door) return res.status(404).json({ success: false, message: "Luke finnes ikke" });

    await Promise.all([
      AdventAttempt.deleteMany({ adventDay: door._id }),
      AdventResult.deleteMany({ adventDay: door._id }),
    ]);

    const imageDir = path.join(ADVENT_IMAGE_ROOT, String(year), String(day));
    if (imageDir.startsWith(ADVENT_IMAGE_ROOT) && fs.existsSync(imageDir)) {
      fs.rmSync(imageDir, { recursive: true, force: true });
    }

    await door.deleteOne();
    res.status(200).json({ success: true, message: `Luke ${day} slettet` });
  } catch (error) {
    console.error("Advent admin delete error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke slette luken" });
  }
};

// @desc    Edit a door's text fields (not images - see adminUploadDayImage
//          below, or generateAdventImages.js for bulk)
// @route   PUT /api/advent/:year/:day/admin
// @access  Private/Admin
exports.adminUpdateDay = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const day = Number(req.params.day);
    const editable = ["title", "author", "altTitles", "isbn", "publishedYear", "pageCount", "genre", "hint1", "hint2", "hint3"];
    const updates = {};
    for (const field of editable) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const door = await AdventDay.findOneAndUpdate({ year, day }, updates, { new: true });
    if (!door) return res.status(404).json({ success: false, message: "Luke finnes ikke" });
    res.status(200).json({ success: true, door });
  } catch (error) {
    console.error("Advent admin update error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke oppdatere luken" });
  }
};

// @desc    Manually sweep doors past their deadline into the library (the
//          lazy publish on GET :day normally covers this - this is a
//          backstop admin can trigger on demand)
// @route   POST /api/advent/:year/admin/publish-due
// @access  Private/Admin
exports.adminPublishDue = async (req, res) => {
  try {
    await sweepDueDoors();
    res.status(200).json({ success: true, message: "Forfalte luker publisert til biblioteket" });
  } catch (error) {
    console.error("Advent admin publish error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke publisere luker" });
  }
};

// @desc    Re-run door-count badge awarding for every member - safe to run
//          repeatedly, and the way to launch badges retroactively.
// @route   POST /api/advent/:year/admin/recalculate-badges
// @access  Private/Admin
exports.adminRecalculateBadges = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const results = await recalculateDoorCountBadgesForYear(year);
    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error("Advent admin badge recalc error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke regne ut badges" });
  }
};

// @desc    Upload/replace a door's cover - runs it through the same
//          downscale+nearest-neighbor pipeline as generateAdventImages.js.
//          The raw upload is held in memory (see adventImageUpload.js) and
//          never written to disk on its own.
// @route   POST /api/advent/:year/:day/admin/image
// @access  Private/Admin
exports.adminUploadDayImage = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const day = Number(req.params.day);
    const door = await AdventDay.findOne({ year, day });
    if (!door) return res.status(404).json({ success: false, message: "Luke finnes ikke" });
    if (!req.file) return res.status(400).json({ success: false, message: "Mangler bildefil" });

    const keys = await processAdventCover(req.file.buffer, year, day);
    Object.assign(door, keys);
    await door.save();

    res.status(200).json({ success: true, door });
  } catch (error) {
    console.error("Advent admin image upload error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke laste opp bildet" });
  }
};

// @desc    Read this year's launch state ("open" to every member, or
//          "admin-only" while it's being prepared)
// @route   GET /api/advent/:year/admin/visibility
// @access  Private/Admin
exports.adminGetVisibility = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const visibility = await getVisibility(visibilityKey(year));
    res.status(200).json({ success: true, visibility });
  } catch (error) {
    console.error("Advent admin get visibility error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente synlighet" });
  }
};

// @desc    Flip this year's launch state
// @route   PUT /api/advent/:year/admin/visibility
// @access  Private/Admin
exports.adminSetVisibility = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const visibility = await setVisibility(visibilityKey(year), req.body.visibility);
    res.status(200).json({ success: true, visibility });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
