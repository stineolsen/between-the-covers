const mongoose = require("mongoose");

// General-purpose badge definition - not advent-specific, so the same model
// can carry season/year-round achievements later (see UserBadge for the
// award side). `year` is null for a badge that isn't tied to a single year.
const badgeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    icon: { type: String, default: null },
    year: { type: Number, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Badge", badgeSchema);
