const mongoose = require("mongoose");

const listNotificationSchema = new mongoose.Schema(
  {
    list: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "List",
      required: true,
    },

    type: {
      type: String,
      enum: ["shared", "comment"],
      required: true,
    },

    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Only set for type "comment"
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },

    // Only used for type "shared" (optional share note)
    message: {
      type: String,
      maxlength: 500,
      trim: true,
    },

    dismissedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

// Index for fast lookup of notifications for a user
listNotificationSchema.index({ recipients: 1, createdAt: -1 });

module.exports = mongoose.model("ListNotification", listNotificationSchema);
