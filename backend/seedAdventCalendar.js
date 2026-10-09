// Seed script for the "gjett boka" advent calendar doors from a CSV export
// of the "Bøker" sheet in julekalender_boker.xlsx. Only rows with a "Luke
// nr." value are imported (the sheet also holds reserve books with none).
//
// Usage: node seedAdventCalendar.js path/to/bøker.csv [--year=2026]
//
// Safe to run more than once: doors are upserted on (year, day), and the
// answer Book for each door is matched by normalized title+author before
// creating a new one, so re-running after fixing a typo in the sheet never
// produces duplicates.

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Book = require("./src/models/Book");
const AdventDay = require("./src/models/AdventDay");
const User = require("./src/models/User");
const { normalizeTitle, normalizeAuthor } = require("./src/utils/importHelpers");

const csvPath = process.argv[2];
const yearArg = process.argv.find((a) => a.startsWith("--year="));
const year = yearArg ? Number(yearArg.split("=")[1]) : new Date().getFullYear();

if (!csvPath) {
  console.error("Usage: node seedAdventCalendar.js path/to/bøker.csv [--year=2026]");
  process.exit(1);
}

// Minimal CSV parser: handles quoted fields (with embedded commas and
// doubled "" quotes) but not quoted fields spanning multiple lines - the
// sheet's export doesn't need that.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function header(headers, ...candidates) {
  for (const candidate of candidates) {
    const idx = headers.findIndex((h) => h.trim().toLowerCase() === candidate.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

async function run() {
  const text = fs.readFileSync(path.resolve(csvPath), "utf-8");
  const rows = parseCsv(text);
  const headers = rows[0];
  const col = {
    title: header(headers, "Tittel"),
    author: header(headers, "Forfatter"),
    altTitle: header(headers, "Norsk tittel"),
    published: header(headers, "Utgitt"),
    pages: header(headers, "Sider"),
    genre: header(headers, "Sjanger"),
    hint1: header(headers, "Hint 1"),
    hint2: header(headers, "Hint 2"),
    hint3: header(headers, "Hint 3"),
    isbn: header(headers, "ISBN"),
    day: header(headers, "Luke nr.", "Luke nr", "Luke"),
  };
  if (col.title === -1 || col.author === -1 || col.day === -1) {
    console.error("Fant ikke forventede kolonner (Tittel/Forfatter/Luke nr.) i CSV-filen.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB Connected");

  const admin = await User.findOne({ role: "admin" });
  if (!admin) {
    console.error("Fant ingen admin-bruker. Opprett en admin først (node seedAdmin.js).");
    process.exit(1);
  }

  const dataRows = rows.slice(1).filter((r) => (r[col.day] || "").trim() !== "");
  console.log(`Fant ${dataRows.length} rader med luke-nummer for ${year}.`);

  for (const r of dataRows) {
    const title = (r[col.title] || "").trim();
    const author = (r[col.author] || "").trim();
    const day = Number((r[col.day] || "").trim());
    const altTitle = col.altTitle !== -1 ? (r[col.altTitle] || "").trim() : "";
    const publishedYear = col.published !== -1 ? parseInt(r[col.published], 10) || null : null;
    const pageCount = col.pages !== -1 ? (r[col.pages] || "").trim() || null : null;
    const genre = col.genre !== -1 ? (r[col.genre] || "").trim() : "";
    const isbn = col.isbn !== -1 ? (r[col.isbn] || "").trim() || null : null;

    if (!title || !author || !day || day < 1 || day > 24) {
      console.warn(`Hopper over rad med ugyldig tittel/forfatter/luke: "${title}" / "${author}" / "${r[col.day]}"`);
      continue;
    }

    // Reuse an existing Book if one already matches (e.g. a re-run, or the
    // book happens to already be in the library) rather than creating a
    // duplicate.
    const normTitle = normalizeTitle(title);
    const normAuthor = normalizeAuthor(author);
    let book = await Book.findOne({ titleNormalized: normTitle, authorNormalized: normAuthor });
    if (!book) {
      book = await Book.create({
        title,
        author,
        isbn: isbn || undefined,
        publishedYear: publishedYear || undefined,
        genres: genre ? [genre] : [],
        hiddenFromLibrary: true,
        addedBy: admin._id,
      });
      console.log(`  Opprettet skjult bok: ${title} av ${author}`);
    } else if (!book.hiddenFromLibrary) {
      // Already a normal library book (e.g. matched an existing title) -
      // leave it visible rather than yanking something already public.
      console.warn(`  "${title}" finnes allerede synlig i biblioteket - lar den stå synlig.`);
    }

    await AdventDay.findOneAndUpdate(
      { year, day },
      {
        year,
        day,
        title,
        author,
        altTitles: altTitle ? [altTitle] : [],
        isbn,
        publishedYear,
        pageCount,
        genre,
        hint1: col.hint1 !== -1 ? r[col.hint1] || "" : "",
        hint2: col.hint2 !== -1 ? r[col.hint2] || "" : "",
        hint3: col.hint3 !== -1 ? r[col.hint3] || "" : "",
        answerBookId: book._id,
      },
      { upsert: true, new: true },
    );
    console.log(`  Luke ${day}: ${title} (${year})`);
  }

  console.log("Ferdig.");
  process.exit(0);
}

run().catch((error) => {
  console.error("Feil under seeding av julekalender:", error);
  process.exit(1);
});
