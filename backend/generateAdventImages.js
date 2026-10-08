// Generates the four pixelated reveal levels (plus the original) for each
// advent calendar door, from a folder of cover images named 01.jpg..24.jpg
// (also accepts .jpeg/.png). Re-run freely after swapping a cover - output
// filenames are deterministic, so this always just overwrites them.
//
// Usage: node generateAdventImages.js path/to/covers-folder [--year=2026]
//
// Same pipeline as the admin page's per-door image upload
// (adminUploadDayImage in adventController.js, via adventImagePipeline.js) -
// use whichever is more convenient for bulk vs. one-off swaps.

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const AdventDay = require("./src/models/AdventDay");
const { processAdventCover, LEVEL_WIDTHS } = require("./src/utils/adventImagePipeline");

const coversDir = process.argv[2];
const yearArg = process.argv.find((a) => a.startsWith("--year="));
const year = yearArg ? Number(yearArg.split("=")[1]) : new Date().getFullYear();

if (!coversDir) {
  console.error("Usage: node generateAdventImages.js path/to/covers-folder [--year=2026]");
  process.exit(1);
}

async function run() {
  const files = fs.readdirSync(path.resolve(coversDir)).filter((f) => /^\d{1,2}\.(jpe?g|png)$/i.test(f));
  if (files.length === 0) {
    console.error(`Fant ingen filer i ${coversDir} på formen NN.jpg.`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB Connected");

  for (const file of files) {
    const day = parseInt(file, 10);
    if (!day || day < 1 || day > 24) continue;

    const door = await AdventDay.findOne({ year, day });
    if (!door) {
      console.warn(`Ingen AdventDay for luke ${day} (${year}) - hopper over ${file}. Kjør seedAdventCalendar.js først.`);
      continue;
    }

    const sourcePath = path.join(path.resolve(coversDir), file);
    const keys = await processAdventCover(sourcePath, year, day);
    Object.assign(door, keys);
    await door.save();

    console.log(`  Luke ${day}: bilder generert (${LEVEL_WIDTHS[1]}px -> ${LEVEL_WIDTHS[4]}px -> original)`);
  }

  console.log("Ferdig.");
  process.exit(0);
}

run().catch((error) => {
  console.error("Feil under bildegenerering:", error);
  process.exit(1);
});
