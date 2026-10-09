const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const AdventDay = require("../models/AdventDay");
const Book = require("../models/Book");
const { now, doorDeadline } = require("./calendarClock");
const { LEADERBOARD_DEADLINE_DAYS_AFTER_OPEN } = require("../constants/adventConfig");
const { ADVENT_IMAGE_ROOT, BOOKS_UPLOAD_DIR } = require("./adventPaths");

function isDeadlinePassed(adventDay) {
  const deadline = doorDeadline(adventDay.year, adventDay.day, LEADERBOARD_DEADLINE_DAYS_AFTER_OPEN);
  return now() >= deadline;
}

// Copies the door's revealed original cover into the normal books upload
// dir so it displays exactly like any other book cover (same coverImage /
// getCoverUrl convention as uploads made through the admin UI).
function copyOriginalIntoBooksUploads(adventDay) {
  if (!adventDay.imageOriginalKey) return null;
  const source = path.join(ADVENT_IMAGE_ROOT, adventDay.imageOriginalKey);
  if (!fs.existsSync(source)) return null;

  fs.mkdirSync(BOOKS_UPLOAD_DIR, { recursive: true });
  const ext = path.extname(source) || ".jpg";
  const filename = `advent-${adventDay.year}-${adventDay.day}-${crypto.randomBytes(4).toString("hex")}${ext}`;
  fs.copyFileSync(source, path.join(BOOKS_UPLOAD_DIR, filename));
  return filename;
}

// Idempotent: safe to call for the same door any number of times, from a
// request handler or a cron job. Does nothing until the door's leaderboard
// deadline has passed, and does nothing once publishedToLibraryAt is set.
// Unhides the door's existing answerBookId (created hidden by the seed
// script) rather than creating a new Book - that's the same document
// guessed against all along, now just visible in the normal library.
// Intentionally does NOT touch Calibre-Web - see docs/julekalender-design.md
// section 1. Never creates an Activity/feed entry or a notification, since
// nothing here calls into emailService/pushService/ListNotification.
async function publishDoorToLibraryIfDue(adventDay) {
  if (adventDay.publishedToLibraryAt) return adventDay;
  if (!isDeadlinePassed(adventDay)) return adventDay;

  const book = await Book.findById(adventDay.answerBookId);
  if (!book) {
    console.error(`Advent library publish: answerBookId missing for day ${adventDay.day}`);
    return adventDay;
  }

  const coverImage = copyOriginalIntoBooksUploads(adventDay);
  book.hiddenFromLibrary = false;
  if (coverImage) book.coverImage = coverImage;
  await book.save();

  adventDay.publishedToLibraryAt = now();
  await adventDay.save();
  return adventDay;
}

// Safety-net sweep for doors nobody has queried since their deadline passed
// (lazy publish only runs when a door is actually requested). Called daily
// from notificationScheduler and can be re-run freely.
async function sweepDueDoors() {
  const dueDoors = await AdventDay.find({ publishedToLibraryAt: null });
  for (const door of dueDoors) {
    await publishDoorToLibraryIfDue(door);
  }
}

module.exports = { publishDoorToLibraryIfDue, sweepDueDoors, isDeadlinePassed };
