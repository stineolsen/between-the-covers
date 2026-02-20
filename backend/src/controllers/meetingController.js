const Meeting = require("../models/Meeting");
const Book = require("../models/Book");

// @desc    Get all meetings (with optional filters)
// @route   GET /api/meetings
// @access  Private
exports.getMeetings = async (req, res) => {
  try {
    const { status, upcoming, past } = req.query;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    } else if (upcoming === "true") {
      query.status = "upcoming";
    } else if (past === "true") {
      query.status = "past";
    }

    // Get meetings and sort by date (upcoming: ascending, past: descending)
    let sortOrder = 1; // ascending (oldest first for upcoming)
    if (query.status === "past") {
      sortOrder = -1; // descending (newest first for past)
    }

    const meetings = await Meeting.find(query).sort({ date: sortOrder });

    res.status(200).json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error) {
    console.error("Get meetings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch meetings",
    });
  }
};

// @desc    Get next upcoming meeting
// @route   GET /api/meetings/next
// @access  Private
exports.getNextMeeting = async (req, res) => {
  try {
    const now = new Date();

    const meeting = await Meeting.findOne({
      status: "upcoming",
      date: { $gte: now },
    }).sort({ date: 1 });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "No upcoming meetings found",
      });
    }

    res.status(200).json({
      success: true,
      meeting,
    });
  } catch (error) {
    console.error("Get next meeting error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch next meeting",
    });
  }
};

// @desc    Get single meeting
// @route   GET /api/meetings/:id
// @access  Private
exports.getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    res.status(200).json({
      success: true,
      meeting,
    });
  } catch (error) {
    console.error("Get meeting error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch meeting",
    });
  }
};

// @desc    Create new meeting
// @route   POST /api/meetings
// @access  Private (Admin only)
exports.createMeeting = async (req, res) => {
  try {
    const { title, date, time, location, description, bookId, maxAttendees } =
      req.body;

    // Validate book if provided
    if (bookId) {
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({
          success: false,
          message: "Book not found",
        });
      }
    }

    // Create meeting
    const meeting = await Meeting.create({
      title,
      date,
      time,
      location,
      description,
      book: bookId || null,
      maxAttendees: maxAttendees || 0,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      meeting,
    });
  } catch (error) {
    console.error("Create meeting error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create meeting",
    });
  }
};

// @desc    Update meeting
// @route   PUT /api/meetings/:id
// @access  Private (Admin only)
exports.updateMeeting = async (req, res) => {
  try {
    const {
      title,
      date,
      time,
      location,
      description,
      bookId,
      status,
      maxAttendees,
      notes,
    } = req.body;

    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Validate book if provided
    if (bookId) {
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({
          success: false,
          message: "Book not found",
        });
      }
    }

    // Update fields
    if (title !== undefined) meeting.title = title;
    if (date !== undefined) meeting.date = date;
    if (time !== undefined) meeting.time = time;
    if (location !== undefined) meeting.location = location;
    if (description !== undefined) meeting.description = description;
    if (bookId !== undefined) meeting.book = bookId || null;
    if (status !== undefined) meeting.status = status;
    if (maxAttendees !== undefined) meeting.maxAttendees = maxAttendees;
    if (notes !== undefined) meeting.notes = notes;

    await meeting.save();

    res.status(200).json({
      success: true,
      message: "Meeting updated successfully",
      meeting,
    });
  } catch (error) {
    console.error("Update meeting error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update meeting",
    });
  }
};

// @desc    Delete meeting
// @route   DELETE /api/meetings/:id
// @access  Private (Admin only)
exports.deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    await meeting.deleteOne();

    res.status(200).json({
      success: true,
      message: "Meeting deleted successfully",
    });
  } catch (error) {
    console.error("Delete meeting error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete meeting",
    });
  }
};

// @desc    RSVP to meeting (add/remove attendee)
// @route   POST /api/meetings/:id/rsvp
// @access  Private
exports.rsvpMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Check if meeting is in the past or cancelled
    if (meeting.status === "past") {
      return res.status(400).json({
        success: false,
        message: "Cannot RSVP to past meetings",
      });
    }

    if (meeting.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "This meeting has been cancelled",
      });
    }

    const isAttending = meeting.isUserAttending(req.user._id);

    if (isAttending) {
      // Remove RSVP
      await meeting.removeAttendee(req.user._id);
      // Re-populate after save
      await meeting.populate([
        { path: "book", select: "title author coverImage" },
        { path: "createdBy", select: "username displayName avatar" },
        { path: "attendees", select: "username displayName avatar" },
      ]);
      res.status(200).json({
        success: true,
        message: "RSVP removed successfully",
        meeting,
        isAttending: false,
      });
    } else {
      // Add RSVP
      await meeting.addAttendee(req.user._id);
      // Re-populate after save
      await meeting.populate([
        { path: "book", select: "title author coverImage" },
        { path: "createdBy", select: "username displayName avatar" },
        { path: "attendees", select: "username displayName avatar" },
      ]);
      res.status(200).json({
        success: true,
        message: "RSVP confirmed successfully",
        meeting,
        isAttending: true,
      });
    }
  } catch (error) {
    console.error("RSVP meeting error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to RSVP to meeting",
    });
  }
};
