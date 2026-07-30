const mongoose = require("mongoose");

const listSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },

    // Short blurb
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // Longer freeform notes
    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [5000, "Notes cannot exceed 5000 characters"],
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },

    // Collaborators have full edit rights, same as the owner (except delete)
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },

    // Array order is the rank order of books in this list
    books: [
      {
        book: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Book",
          required: true,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes
listSchema.index({ visibility: 1, createdAt: -1 }); // Browse public lists
listSchema.index({ owner: 1 }); // My lists (owned)
listSchema.index({ collaborators: 1 }); // My lists (collaborating)

// Whether a user can edit this list (owner or collaborator)
listSchema.methods.canEdit = function (userId) {
  // owner/collaborators may be raw ObjectIds or populated User docs
  // (the pre-find hook below always populates them on reads), so compare
  // via ._id when present rather than assuming a raw ObjectId.
  const idStr = (v) => (v && v._id ? v._id.toString() : v.toString());
  const userIdStr = userId.toString();
  if (idStr(this.owner) === userIdStr) return true;
  return this.collaborators.some((c) => idStr(c) === userIdStr);
};

// Whether a user can view this list (public, or can edit it)
listSchema.methods.canView = function (userId) {
  if (this.visibility === "public") return true;
  return this.canEdit(userId);
};

// Populate owner/collaborator/book details when querying
listSchema.pre(/^find/, function () {
  this.populate({ path: "owner", select: "username displayName avatar" })
    .populate({ path: "collaborators", select: "username displayName avatar" })
    .populate({ path: "books.book", select: "title author coverImage genres averageRating" })
    .populate({ path: "books.addedBy", select: "username displayName avatar" });
});

module.exports = mongoose.model("List", listSchema);
