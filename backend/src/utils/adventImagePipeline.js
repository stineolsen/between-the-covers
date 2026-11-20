const sharp = require("sharp");
const AdventImage = require("../models/AdventImage");

// Widths the source is downscaled to before scaling back up with
// nearest-neighbor - these control how blocky/revealing each level looks.
const LEVEL_WIDTHS = { 1: 8, 2: 12, 3: 20, 4: 36 };
const DISPLAY_WIDTH = 480;

// Shared by generateAdventImages.js (CLI, reads a file path) and the admin
// upload endpoint (reads a Buffer) - sharp() accepts either. Stores
// original.jpg + level1-4.jpg as AdventImage documents (MongoDB, not disk -
// see AdventImage.js) and returns the keys to store on the AdventDay.
async function processAdventCover(source, year, day) {
  const keyFor = (file) => `${year}/${day}/${file}`;
  const images = []; // [key, buffer]

  const meta = await sharp(source).metadata();
  const aspect = meta.height / meta.width;
  const displayHeight = Math.round(DISPLAY_WIDTH * aspect);

  images.push([
    keyFor("original.jpg"),
    await sharp(source).resize(DISPLAY_WIDTH, displayHeight, { fit: "fill" }).jpeg({ quality: 88 }).toBuffer(),
  ]);

  for (const [level, smallWidth] of Object.entries(LEVEL_WIDTHS)) {
    const smallHeight = Math.max(1, Math.round(smallWidth * aspect));
    const smallBuffer = await sharp(source)
      .resize(smallWidth, smallHeight, { fit: "fill" })
      .toBuffer();
    images.push([
      keyFor(`level${level}.jpg`),
      await sharp(smallBuffer)
        .resize(DISPLAY_WIDTH, displayHeight, { kernel: "nearest", fit: "fill" })
        .jpeg({ quality: 80 })
        .toBuffer(),
    ]);
  }

  // Overwrites a previous upload for the same door
  await AdventImage.bulkWrite(
    images.map(([key, data]) => ({
      updateOne: { filter: { key }, update: { $set: { key, data, contentType: "image/jpeg" } }, upsert: true },
    })),
  );

  return {
    imageOriginalKey: `${year}/${day}/original.jpg`,
    imageLevel1Key: `${year}/${day}/level1.jpg`,
    imageLevel2Key: `${year}/${day}/level2.jpg`,
    imageLevel3Key: `${year}/${day}/level3.jpg`,
    imageLevel4Key: `${year}/${day}/level4.jpg`,
  };
}

module.exports = { processAdventCover, LEVEL_WIDTHS, DISPLAY_WIDTH };
