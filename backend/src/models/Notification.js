const mongoose = require("mongoose");
const { NOTIFICATION_TYPES } = require("../constants/notificationConfig");

// Single unified in-app notification, replacing the old list-only
// ListNotification model (see utils/notificationCenter.js). Deliberately
// generic rather than a polymorphic ref per type - "message" and "link"
// are precomputed in full at creation time (by the trigger site, via
// createNotification), so the bell UI never needs type-specific rendering
// or population logic, just "show message, navigate to link on click".
const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    message: { type: String, required: true },
    link: { type: String, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

notificationSchema.pre(/^find/, function () {
  this.populate({ path: "from", select: "username displayName avatar" });
});

module.exports = mongoose.model("Notification", notificationSchema);
