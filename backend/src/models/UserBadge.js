const mongoose = require("mongoose");

const userBadgeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    badge: { type: mongoose.Schema.Types.ObjectId, ref: "Badge", required: true },
    awardedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// The unique index is what makes awarding idempotent - badgeAwarder relies
// on upsert-with-$setOnInsert against this index rather than a check-then-
// write, so re-running the awarder never produces a duplicate.
userBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });

module.exports = mongoose.model("UserBadge", userBadgeSchema);
