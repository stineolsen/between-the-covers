const mongoose = require("mongoose");
const Setting = require("../models/Setting");
const Book = require("../models/Book");
const {
  normalizeTitle,
  normalizeAuthor,
  normalizeLanguageForAtlas,
  titleSimilarity,
  parseOpdsEntry,
  fetchOpdsXml,
  getOpdsNextPageUrl,
  resolveAbsLibraryId,
  fetchAllAbsItems,
  mapAbsItem,
} = require("../utils/importHelpers");
const { syncAbsListeningStats } = require("../utils/absListeningSync");

const CALIBRE_SINCE_KEY = "calibreImportSince";
const MAX_OPDS_PAGES = 200;

// Shared metadata fields for both the insert and update paths below.
// libraryLinks.ebook is deliberately NOT included here - it's set separately
// via dot notation in each op, since a plain `libraryLinks: {...}` in $set
// replaces the whole subdocument and would silently wipe out any existing
// libraryLinks.audiobook (e.g. one set by the Audiobookshelf sync, or the
// admin "match"/"add as new book" flow for an unmatched audiobook).
function calibreMetadataFields(parsed, adminUserId, titleNormalized, authorNormalized) {
  return {
    title: parsed.title,
    author: parsed.author,
    description: parsed.description,
    series: parsed.series,
    seriesNumber: parsed.seriesNumber,
    publishedYear: parsed.publishedYear,
    genres: parsed.genres,
    publisher: parsed.publisher,
    language: normalizeLanguageForAtlas(parsed.languageCode),
    languageCode: parsed.languageCode,
    lastModified: parsed.updatedAt,
    calibreId: parsed.calibreId,
    addedBy: adminUserId,
    titleNormalized,
    authorNormalized,
  };
}

// A book already exists that matches this OPDS entry (by exact or fuzzy
// title/author match against the current catalog) - update it in place
// rather than inserting a duplicate.
function buildCalibreBookUpdateOp(parsed, calibreWebBookBase, adminUserId, targetId, titleNormalized, authorNormalized) {
  return {
    updateOne: {
      filter: { _id: targetId },
      update: {
        $set: {
          ...calibreMetadataFields(parsed, adminUserId, titleNormalized, authorNormalized),
          "libraryLinks.ebook": parsed.calibreId ? `${calibreWebBookBase}${parsed.calibreId}` : null,
          updatedAt: new Date(),
        },
      },
    },
  };
}

// No existing book matched - insert a new one. Caller supplies `_id` so it
// can immediately register this book in its in-memory matching maps, in
// case a later OPDS entry in the same import run normalizes to the same
// title+author (see runCalibreImport).
function buildCalibreBookInsertOp(id, parsed, calibreWebBookBase, adminUserId, titleNormalized, authorNormalized) {
  return {
    insertOne: {
      document: {
        _id: id,
        ...calibreMetadataFields(parsed, adminUserId, titleNormalized, authorNormalized),
        libraryLinks: {
          ebook: parsed.calibreId ? `${calibreWebBookBase}${parsed.calibreId}` : null,
          audiobook: null,
        },
        calibreDownloadLink: null,
        averageRating: 0,
        reviewCount: 0,
        dateAdded: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  };
}

exports.getImportStatus = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: CALIBRE_SINCE_KEY });
    res.status(200).json({
      success: true,
      calibreImportSince: setting?.value ? new Date(setting.value).toISOString() : null,
    });
  } catch (error) {
    console.error("Get import status error:", error);
    res.status(500).json({ success: false, message: "Failed to load import status" });
  }
};

exports.setCalibreImportSince = async (req, res) => {
  try {
    const { since } = req.body;
    const value = since ? new Date(since) : null;
    if (since && Number.isNaN(value?.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid date" });
    }

    await Setting.findOneAndUpdate({ key: CALIBRE_SINCE_KEY }, { value }, { upsert: true });

    res.status(200).json({
      success: true,
      calibreImportSince: value ? value.toISOString() : null,
    });
  } catch (error) {
    console.error("Set import since error:", error);
    res.status(500).json({ success: false, message: "Failed to update import date" });
  }
};

// @desc    Admin: import/update books from the Calibre-Web OPDS feed
// @route   POST /api/admin/import/calibre/run
// @access  Private (admin only)
exports.runCalibreImport = async (req, res) => {
  try {
    const { CALIBRE_WEB_BASE_URL, CALIBRE_WEB_USERNAME, CALIBRE_WEB_PASSWORD } = process.env;
    if (!CALIBRE_WEB_BASE_URL || !CALIBRE_WEB_USERNAME || !CALIBRE_WEB_PASSWORD) {
      return res.status(500).json({
        success: false,
        message: "Missing CALIBRE_WEB_BASE_URL/CALIBRE_WEB_USERNAME/CALIBRE_WEB_PASSWORD env vars",
      });
    }

    const settingDoc = await Setting.findOne({ key: CALIBRE_SINCE_KEY });
    const since = settingDoc?.value ? new Date(settingDoc.value) : null;
    const runStartedAt = new Date();
    const calibreWebBookBase = `${CALIBRE_WEB_BASE_URL.replace(/\/$/, "")}/book/`;

    let url = new URL("/opds/new", CALIBRE_WEB_BASE_URL).toString();
    let pageCount = 0;
    let scanned = 0;
    let skipped = 0;
    let reachedCutoff = false;
    const parsedEntries = [];

    while (url && pageCount < MAX_OPDS_PAGES) {
      const xml = await fetchOpdsXml(url, CALIBRE_WEB_USERNAME, CALIBRE_WEB_PASSWORD);
      const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];

      for (const entryXml of entries) {
        const parsed = parseOpdsEntry(entryXml);
        if (!parsed || !parsed.updatedAt) continue;
        scanned++;

        if (since && parsed.updatedAt <= since) {
          reachedCutoff = true;
          break;
        }

        if (!parsed.title || !parsed.author) {
          skipped++;
          continue;
        }

        parsedEntries.push(parsed);
      }

      pageCount++;
      if (reachedCutoff) break;
      url = getOpdsNextPageUrl(xml, CALIBRE_WEB_BASE_URL);
    }

    // Match each entry against the existing catalog the same way runAbsSync
    // does (exact normalized title+author, then fuzzy title with tolerant
    // author matching) so re-importing a book that already exists - e.g. one
    // added via the Audiobookshelf "unmatched" admin flow - updates it in
    // place instead of creating a duplicate.
    const booksCollection = mongoose.connection.db.collection("books");
    const mongoBooks = await booksCollection
      .find({}, { projection: { _id: 1, title: 1, author: 1, titleNormalized: 1, authorNormalized: 1 } })
      .toArray();
    const byNorm = new Map();
    for (const b of mongoBooks) {
      const key = `${b.titleNormalized || normalizeTitle(b.title)}::${b.authorNormalized || normalizeAuthor(b.author)}`;
      byNorm.set(key, b);
    }

    let matchedExact = 0;
    let matchedFuzzy = 0;
    const ops = [];

    for (const parsed of parsedEntries) {
      const titleNormalized = normalizeTitle(parsed.title);
      const authorNormalized = normalizeAuthor(parsed.author);
      const key = `${titleNormalized}::${authorNormalized}`;

      let target = byNorm.get(key) || null;
      if (target) {
        matchedExact++;
      } else {
        let best = null;
        let bestScore = 0;
        for (const m of mongoBooks) {
          const mAuthorNormalized = m.authorNormalized || normalizeAuthor(m.author);
          const authorOk =
            !authorNormalized ||
            !mAuthorNormalized ||
            mAuthorNormalized === authorNormalized ||
            mAuthorNormalized.includes(authorNormalized) ||
            authorNormalized.includes(mAuthorNormalized);

          if (!authorOk) continue;

          const score = titleSimilarity(parsed.title, m.title);
          if (score > bestScore) {
            bestScore = score;
            best = m;
          }
        }
        if (best && bestScore >= 0.9) {
          target = best;
          matchedFuzzy++;
        }
      }

      if (target) {
        ops.push(buildCalibreBookUpdateOp(parsed, calibreWebBookBase, req.user._id, target._id, titleNormalized, authorNormalized));
      } else {
        const id = new mongoose.Types.ObjectId();
        ops.push(buildCalibreBookInsertOp(id, parsed, calibreWebBookBase, req.user._id, titleNormalized, authorNormalized));
        // Register immediately so a later entry in this same run that
        // normalizes to the same key updates this one instead of also
        // inserting - bulkWrite ops don't see each other's effects.
        const stub = { _id: id, title: parsed.title, author: parsed.author, titleNormalized, authorNormalized };
        byNorm.set(key, stub);
        mongoBooks.push(stub);
      }
    }

    let inserted = 0;
    let modified = 0;
    if (ops.length) {
      // Ordered, unlike the other bulkWrites in this file - a later op may
      // reference the _id of an earlier insertOne in the same batch (see
      // above), so they must run in sequence for that to resolve correctly.
      const result = await booksCollection.bulkWrite(ops, { ordered: true });
      inserted = result.insertedCount;
      modified = result.modifiedCount;
    }

    await Setting.findOneAndUpdate(
      { key: CALIBRE_SINCE_KEY },
      { value: runStartedAt },
      { upsert: true },
    );

    res.status(200).json({
      success: true,
      scanned,
      skipped,
      inserted,
      modified,
      matchedExact,
      matchedFuzzy,
      since: since ? since.toISOString() : null,
      calibreImportSince: runStartedAt.toISOString(),
    });
  } catch (error) {
    console.error("Calibre import error:", error);
    res.status(500).json({ success: false, message: "Failed to run Calibre import" });
  }
};

// @desc    Admin: sync audiobook links from Audiobookshelf (never overwrites existing links)
// @route   POST /api/admin/import/abs/run
// @access  Private (admin only)
exports.runAbsSync = async (req, res) => {
  try {
    const { ABS_BASE_URL, ABS_TOKEN, ABS_LIBRARY_ID, ABS_PUBLIC_ITEM_BASE } = process.env;
    if (!ABS_BASE_URL || !ABS_TOKEN) {
      return res.status(500).json({
        success: false,
        message: "Missing ABS_BASE_URL/ABS_TOKEN env vars",
      });
    }

    const { id: libraryId, available } = await resolveAbsLibraryId(
      ABS_BASE_URL,
      ABS_TOKEN,
      ABS_LIBRARY_ID,
    );
    if (!libraryId) {
      return res.status(500).json({
        success: false,
        message: "Set ABS_LIBRARY_ID to one of the available libraries",
        availableLibraries: available,
      });
    }

    const items = await fetchAllAbsItems(ABS_BASE_URL, ABS_TOKEN, libraryId);
    const absBooks = items.map((item) => mapAbsItem(item, ABS_PUBLIC_ITEM_BASE)).filter((b) => b.absId && b.title);

    const booksCollection = mongoose.connection.db.collection("books");
    const mongoBooks = await booksCollection
      .find(
        {},
        {
          projection: {
            _id: 1,
            isbn: 1,
            title: 1,
            author: 1,
            titleNormalized: 1,
            authorNormalized: 1,
            libraryLinks: 1,
            absId: 1,
          },
        },
      )
      .toArray();

    const byIsbn = new Map();
    const byNorm = new Map();
    const byAbsId = new Map();
    for (const b of mongoBooks) {
      if (b.isbn) byIsbn.set(b.isbn, b);
      if (b.absId) byAbsId.set(b.absId, b);
      const key = `${b.titleNormalized || normalizeTitle(b.title)}::${b.authorNormalized || normalizeAuthor(b.author)}`;
      byNorm.set(key, b);
    }

    let matchedIsbn = 0;
    let matchedExact = 0;
    let matchedFuzzy = 0;
    let unmatched = 0;
    let alreadyLinked = 0;
    const ops = [];
    const unmatchedItems = [];

    for (const a of absBooks) {
      // Checked first, ahead of title/author matching: once an item has been
      // linked - whether by this same auto-match below, or by an admin via
      // the "Match til bok"/"Ny bok" tools for something that never matches
      // automatically (e.g. title mismatches) - it must never show up as
      // unmatched again on a later sync, regardless of what title/author
      // matching would (or wouldn't) find for it.
      let target = a.absId && byAbsId.has(a.absId) ? byAbsId.get(a.absId) : null;

      if (target) {
        // already linked by absId, skip straight to the alreadyLinked check below
      } else if (a.isbn && byIsbn.has(a.isbn)) {
        target = byIsbn.get(a.isbn);
        matchedIsbn++;
      } else {
        const key = `${a.titleNormalized}::${a.authorNormalized}`;
        if (byNorm.has(key)) {
          target = byNorm.get(key);
          matchedExact++;
        } else {
          let best = null;
          let bestScore = 0;
          for (const m of mongoBooks) {
            const mAuthorNormalized = m.authorNormalized || normalizeAuthor(m.author);
            const authorOk =
              !a.authorNormalized ||
              !mAuthorNormalized ||
              mAuthorNormalized === a.authorNormalized ||
              mAuthorNormalized.includes(a.authorNormalized) ||
              a.authorNormalized.includes(mAuthorNormalized);

            if (!authorOk) continue;

            const score = titleSimilarity(a.title, m.title);
            if (score > bestScore) {
              bestScore = score;
              best = m;
            }
          }
          if (best && bestScore >= 0.9) {
            target = best;
            matchedFuzzy++;
          }
        }
      }

      if (!target) {
        unmatched++;
        unmatchedItems.push({
          title: a.title,
          author: a.author,
          absId: a.absId,
          audiobookUrl: a.audiobookUrl,
        });
        continue;
      }

      if (target.libraryLinks?.audiobook) {
        alreadyLinked++;
        continue;
      }

      ops.push({
        updateOne: {
          filter: {
            _id: target._id,
            $or: [
              { "libraryLinks.audiobook": { $exists: false } },
              { "libraryLinks.audiobook": null },
              { "libraryLinks.audiobook": "" },
            ],
          },
          update: {
            $set: {
              "libraryLinks.audiobook": a.audiobookUrl,
              absId: a.absId,
              absUpdatedAt: new Date(),
            },
          },
        },
      });
    }

    let updated = 0;
    if (ops.length) {
      const result = await booksCollection.bulkWrite(ops, { ordered: false });
      updated = result.modifiedCount;
    }

    res.status(200).json({
      success: true,
      scanned: absBooks.length,
      matchedIsbn,
      matchedExact,
      matchedFuzzy,
      unmatched,
      alreadyLinked,
      updated,
      unmatchedItems,
    });
  } catch (error) {
    console.error("ABS sync error:", error);
    res.status(500).json({ success: false, message: "Failed to run Audiobookshelf sync" });
  }
};

// @desc    Admin: refresh members' Audiobookshelf listening-time totals (for the "Topp lytter" badge)
// @route   POST /api/admin/import/abs-listening/run
// @access  Private (admin only)
exports.runAbsListeningSync = async (req, res) => {
  try {
    const result = await syncAbsListeningStats();
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("ABS listening stats sync error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to sync listening stats" });
  }
};

// @desc    Admin: manually link an unmatched Audiobookshelf item to a library book
//          (an admin-driven equivalent of what runAbsSync's automatic matching does)
// @route   POST /api/admin/import/abs/match
// @access  Private (admin only)
exports.matchAbsItem = async (req, res) => {
  try {
    const { bookId, absId, audiobookUrl } = req.body;
    if (!bookId || !audiobookUrl) {
      return res.status(400).json({ success: false, message: "Mangler bookId eller audiobookUrl" });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: "Fant ikke boken" });
    }

    book.libraryLinks = book.libraryLinks || {};
    book.libraryLinks.audiobook = audiobookUrl;
    if (absId) book.absId = absId;
    book.absUpdatedAt = new Date();
    await book.save();

    res.status(200).json({ success: true, message: "Lydbok koblet til", book });
  } catch (error) {
    console.error("Match ABS item error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke koble til lydbok" });
  }
};
