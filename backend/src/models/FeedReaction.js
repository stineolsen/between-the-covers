const mongoose = require("mongoose");
const { FEED_ACTIVITY_TYPES } = require("../constants/feedConfig");

const feedReactionSchema = new mongoose.Schema(
  {
    activityType: { type: String, enum: FEED_ACTIVITY_TYPES, required: true },
    activityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true },
  },
  { timestamps: true },
);

// One reaction per user per emoji per item - re-sending the same emoji
// toggles it off (see feedController.toggleReaction) rather than erroring.
feedReactionSchema.index({ activityType: 1, activityId: 1, user: 1, emoji: 1 }, { unique: true });
feedReactionSchema.index({ activityType: 1, activityId: 1 });

module.exports = mongoose.model("FeedReaction", feedReactionSchema);
