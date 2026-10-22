const mongoose = require("mongoose");
const { FEED_ACTIVITY_TYPES } = require("../constants/feedConfig");

const feedCommentSchema = new mongoose.Schema(
  {
    activityType: { type: String, enum: FEED_ACTIVITY_TYPES, required: true },
    activityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: [true, "Innhold er påkrevd"], trim: true, maxlength: [2000, "Kommentaren kan ikke overstige 2000 tegn"] },
  },
  { timestamps: true },
);

feedCommentSchema.index({ activityType: 1, activityId: 1, createdAt: 1 });

feedCommentSchema.pre(/^find/, function () {
  this.populate({ path: "user", select: "username displayName avatar" });
});

module.exports = mongoose.model("FeedComment", feedCommentSchema);
