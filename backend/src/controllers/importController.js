const mongoose = require("mongoose");
const Setting = require("../models/Setting");
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

function buildCalibreBookOp(parsed, calibreWebBookBase, adminUserId) {
  const titleNormalized = normalizeTitle(parsed.title);
  const authorNormalized = normalizeAuthor(parsed.author);

  const doc = {
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
    libraryLinks: {
      ebook: parsed.calibreId ? `${calibreWebBookBase}${parsed.calibreId}` : null,
    },
    lastModified: parsed.updatedAt,
    calibreId: parsed.calibreId,
    calibreDownloadLink: null,
    addedBy: adminUserId,
    titleNormalized,
    authorNormalized,
  };

  return {
    updateOne: {
      filter: { titleNormalized, authorNormalized },
      update: {
        $setOnInsert: {
          averageRating: 0,
          reviewCount: 0,
          dateAdded: new Date(),
          createdAt: new Date(),
        },
        $set: {
          ...doc,
          updatedAt: new Date(),
        },
      },
      upsert: true,
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
    const ops = [];

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

        ops.push(buildCalibreBookOp(parsed, calibreWebBookBase, req.user._id));
      }

      pageCount++;
      if (reachedCutoff) break;
      url = getOpdsNextPageUrl(xml, CALIBRE_WEB_BASE_URL);
    }

    let inserted = 0;
    let modified = 0;
    if (ops.length) {
      const booksCollection = mongoose.connection.db.collection("books");
      const result = await booksCollection.bulkWrite(ops, { ordered: false });
      inserted = result.upsertedCount;
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
          },
        },
      )
      .toArray();

    const byIsbn = new Map();
    const byNorm = new Map();
    for (const b of mongoBooks) {
      if (b.isbn) byIsbn.set(b.isbn, b);
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
      let target = null;

      if (a.isbn && byIsbn.has(a.isbn)) {
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
