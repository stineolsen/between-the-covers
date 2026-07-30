const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    list: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "List",
      required: [true, "List is required"],
    },

    // null = comment on the list itself; set = comment on this book within the list
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      default: null,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
  },
  {
    timestamps: true,
  },
);

// Fetch a comment thread for a list, or for one book within a list
commentSchema.index({ list: 1, book: 1, createdAt: -1 });

// Populate user info when querying comments
commentSchema.pre(/^find/, function () {
  this.populate({
    path: "user",
    select: "username displayName avatar",
  });
});

module.exports = mongoose.model("Comment", commentSchema);
