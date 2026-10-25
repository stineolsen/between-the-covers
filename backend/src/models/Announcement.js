const mongoose = require("mongoose");

// Site-wide homepage messages from admin - replaces the single-banner
// Setting (site:banner) with a proper collection, since admin wants to
// stack several of these at once and each one can have its own lifespan.
const announcementSchema = new mongoose.Schema(
  {
    html: { type: String, required: true },
    // null = stays up until an admin deletes it; otherwise auto-expires.
    expiresAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

announcementSchema.index({ expiresAt: 1 });

module.exports = mongoose.model("Announcement", announcementSchema);
