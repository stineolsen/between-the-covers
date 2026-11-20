const mongoose = require("mongoose");

// The advent doors' cover images (original + pixelated reveal levels),
// stored in MongoDB rather than on disk: Railway's filesystem is wiped on
// every deploy, which silently lost every image uploaded before the latest
// deploy. Small - a 480px-wide JPEG per level - so a few MB per year.
// `key` is the same "<year>/<day>/<file>.jpg" string AdventDay stores in its
// image*Key fields.
const adventImageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    contentType: { type: String, default: "image/jpeg" },
    data: { type: Buffer, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AdventImage", adventImageSchema);
