const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    // Meeting title
    title: {
      type: String,
      required: [true, "Meeting title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    // Meeting date and time
    date: {
      type: Date,
      required: [true, "Meeting date is required"],
    },

    time: {
      type: String,
      trim: true,
    },

    // Location (physical or online)
    location: {
      type: String,
      trim: true,
      maxlength: [300, "Location cannot exceed 300 characters"],
    },

    // Description/agenda
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    // Book being discussed (optional)
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      default: null,
    },

    // Meeting status
    status: {
      type: String,
      enum: ["upcoming", "past", "cancelled"],
      default: "upcoming",
    },

    // Users who RSVP'd
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Maximum number of attendees (0 = unlimited)
    maxAttendees: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Notes/summary for past meetings
    notes: {
      type: String,
      trim: true,
      maxlength: [5000, "Notes cannot exceed 5000 characters"],
    },

    // Creator of the meeting (admin)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for querying by status and date
meetingSchema.index({ status: 1, date: 1 });

// Virtual for attendee count
meetingSchema.virtual("attendeeCount").get(function () {
  return this.attendees.length;
});

// Virtual to check if meeting is full
meetingSchema.virtual("isFull").get(function () {
  if (this.maxAttendees === 0) return false;
  return this.attendees.length >= this.maxAttendees;
});

// Method to check if user is attending
meetingSchema.methods.isUserAttending = function (userId) {
  return this.attendees.some((attendee) => {
    // Handle both populated user objects and ObjectId references
    const attendeeId = attendee._id || attendee;
    return attendeeId.toString() === userId.toString();
  });
};

// Method to add attendee
meetingSchema.methods.addAttendee = async function (userId) {
  if (this.isUserAttending(userId)) {
    throw new Error("You are already registered for this meeting");
  }

  if (this.isFull) {
    throw new Error("This meeting is full");
  }

  this.attendees.push(userId);
  return this.save();
};

// Method to remove attendee
meetingSchema.methods.removeAttendee = async function (userId) {
  if (!this.isUserAttending(userId)) {
    throw new Error("You are not registered for this meeting");
  }

  this.attendees = this.attendees.filter((attendee) => {
    // Handle both populated user objects and ObjectId references
    const attendeeId = attendee._id || attendee;
    return attendeeId.toString() !== userId.toString();
  });
  return this.save();
};

// Automatically update status based on date
meetingSchema.pre("save", function () {
  const now = new Date();
  const meetingDate = new Date(this.date);

  // If meeting date has passed and status is still upcoming, change to past
  if (meetingDate < now && this.status === "upcoming") {
    this.status = "past";
  }
});

// Populate book and creator details when querying
meetingSchema.pre(/^find/, function () {
  this.populate({
    path: "book",
    select: "title author coverImage",
  })
    .populate({
      path: "createdBy",
      select: "username displayName avatar",
    })
    .populate({
      path: "attendees",
      select: "username displayName avatar",
    });
});

// Ensure virtuals are included in JSON output
meetingSchema.set("toJSON", { virtuals: true });
meetingSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Meeting", meetingSchema);
