const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { ADVENT_IMAGE_ROOT } = require("./adventPaths");

// Widths the source is downscaled to before scaling back up with
// nearest-neighbor - these control how blocky/revealing each level looks.
const LEVEL_WIDTHS = { 1: 8, 2: 12, 3: 20, 4: 36 };
const DISPLAY_WIDTH = 480;

// Shared by generateAdventImages.js (CLI, reads a file path) and the admin
// upload endpoint (reads a Buffer) - sharp() accepts either. Writes
// original.jpg + level1-4.jpg under ADVENT_IMAGE_ROOT/<year>/<day>/ and
// returns the relative keys to store on the AdventDay document.
async function processAdventCover(source, year, day) {
  const outDir = path.join(ADVENT_IMAGE_ROOT, String(year), String(day));
  fs.mkdirSync(outDir, { recursive: true });

  const meta = await sharp(source).metadata();
  const aspect = meta.height / meta.width;
  const displayHeight = Math.round(DISPLAY_WIDTH * aspect);

  await sharp(source)
    .resize(DISPLAY_WIDTH, displayHeight, { fit: "fill" })
    .jpeg({ quality: 88 })
    .toFile(path.join(outDir, "original.jpg"));

  for (const [level, smallWidth] of Object.entries(LEVEL_WIDTHS)) {
    const smallHeight = Math.max(1, Math.round(smallWidth * aspect));
    const smallBuffer = await sharp(source)
      .resize(smallWidth, smallHeight, { fit: "fill" })
      .toBuffer();
    await sharp(smallBuffer)
      .resize(DISPLAY_WIDTH, displayHeight, { kernel: "nearest", fit: "fill" })
      .jpeg({ quality: 80 })
      .toFile(path.join(outDir, `level${level}.jpg`));
  }

  return {
    imageOriginalKey: `${year}/${day}/original.jpg`,
    imageLevel1Key: `${year}/${day}/level1.jpg`,
    imageLevel2Key: `${year}/${day}/level2.jpg`,
    imageLevel3Key: `${year}/${day}/level3.jpg`,
    imageLevel4Key: `${year}/${day}/level4.jpg`,
  };
}

module.exports = { processAdventCover, LEVEL_WIDTHS, DISPLAY_WIDTH };
