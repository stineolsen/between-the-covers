// One-off: writes the cleaned-up page counts, genres and publication years
// from "BTC Data Improvements.xlsx" (converted to bookDataUpdates.json) into
// the books collection, matched on _id.
//
// Run with:
//   node updateBookData.js            -> dry run, only shows what would change
//   node updateBookData.js --apply    -> actually writes to the database
//
// The Calibre sync never writes pageCount and only fills in genres and
// publishedYear when they're empty, so these values survive later syncs.

require("dotenv").config();
// Some home routers don't answer the SRV lookup a mongodb+srv:// URI needs
// (querySrv ETIMEOUT) - ask public DNS servers instead.
require("dns").setServers(["1.1.1.1", "8.8.8.8"]);
const mongoose = require("mongoose");
const updates = require("./bookDataUpdates.json");

const APPLY = process.argv.includes("--apply");

const sameGenres = (a = [], b = []) =>
  a.length === b.length && a.every((g, i) => g === b[i]);

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB Connected (${APPLY ? "SKRIVER" : "tørrkjøring"})\n`);

  const books = mongoose.connection.db.collection("books");
  const ids = updates.map((u) => new mongoose.Types.ObjectId(u.id));
  const existing = new Map(
    (await books
      .find({ _id: { $in: ids } }, { projection: { title: 1, pageCount: 1, genres: 1, publishedYear: 1 } })
      .toArray()).map((b) => [b._id.toString(), b]),
  );

  const ops = [];
  const missing = [];
  let unchanged = 0;
  const counts = { pageCount: 0, genres: 0, publishedYear: 0 };

  for (const u of updates) {
    const book = existing.get(u.id);
    if (!book) {
      missing.push(`${u.title} (${u.id})`);
      continue;
    }

    const set = {};
    if (u.pageCount != null && book.pageCount !== u.pageCount) set.pageCount = u.pageCount;
    if (u.publishedYear != null && book.publishedYear !== u.publishedYear) set.publishedYear = u.publishedYear;
    if (u.genres?.length && !sameGenres(book.genres, u.genres)) set.genres = u.genres;

    if (!Object.keys(set).length) {
      unchanged++;
      continue;
    }
    for (const k of Object.keys(set)) counts[k]++;

    if (!APPLY && ops.length < 15) {
      const diff = Object.keys(set)
        .map((k) => `${k}: ${JSON.stringify(book[k] ?? null)} -> ${JSON.stringify(set[k])}`)
        .join(", ");
      console.log(`  ${book.title}: ${diff}`);
    }
    ops.push({ updateOne: { filter: { _id: book._id }, update: { $set: { ...set, updatedAt: new Date() } } } });
  }

  console.log(`\n${updates.length} rader i fila`);
  console.log(`  ${ops.length} bøker endres (sidetall ${counts.pageCount}, sjangre ${counts.genres}, år ${counts.publishedYear})`);
  console.log(`  ${unchanged} bøker har allerede riktige verdier`);
  if (missing.length) {
    console.log(`  ${missing.length} finnes ikke i databasen (slettet?):`);
    missing.forEach((m) => console.log(`    - ${m}`));
  }

  if (APPLY && ops.length) {
    const result = await books.bulkWrite(ops, { ordered: false });
    console.log(`\n✅ Oppdatert ${result.modifiedCount} bøker`);
  } else if (!APPLY) {
    console.log("\nIngenting er skrevet. Kjør med --apply for å oppdatere databasen.");
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
