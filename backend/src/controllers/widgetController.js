const crypto = require("crypto");
const User = require("../models/User");
const UserBook = require("../models/UserBook");
const Meeting = require("../models/Meeting");

// Phone widgets (Scriptable on iPhone). A member makes a personal widget key
// on their profile; the widget script sends it as "Authorization: Bearer
// btcw_...". The key can only read the small summary below - it is not a
// login. Only its SHA-256 hash is stored, so it can't be shown again; making
// a new one replaces (and stops) the old one.

const PREFIX = "btcw_";
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// @desc    Does the member have a widget key?
// @route   GET /api/widget/token
// @access  Private
exports.getTokenStatus = async (req, res) => {
  res.status(200).json({
    success: true,
    hasToken: !!req.user.widgetTokenCreatedAt,
    createdAt: req.user.widgetTokenCreatedAt || null,
  });
};

// @desc    Make a new widget key (replaces any old one). Returned once.
// @route   POST /api/widget/token
// @access  Private
exports.createToken = async (req, res) => {
  try {
    const token = PREFIX + crypto.randomBytes(24).toString("hex");
    const createdAt = new Date();
    await User.updateOne(
      { _id: req.user._id },
      { widgetTokenHash: hashToken(token), widgetTokenCreatedAt: createdAt },
    );
    res.status(201).json({ success: true, token, createdAt });
  } catch (error) {
    console.error("Create widget token error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke lage widget-nøkkel" });
  }
};

// @desc    Remove the widget key - widgets using it stop working
// @route   DELETE /api/widget/token
// @access  Private
exports.deleteToken = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, { widgetTokenHash: null, widgetTokenCreatedAt: null });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete widget token error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke fjerne widget-nøkkelen" });
  }
};

// Middleware: authenticate with a widget key instead of a login
exports.widgetAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token.startsWith(PREFIX)) {
      return res.status(401).json({ success: false, message: "Mangler widget-nøkkel" });
    }
    const user = await User.findOne({ widgetTokenHash: hashToken(token) }).select(
      "_id displayName username status readingGoal",
    );
    if (!user || user.status !== "approved") {
      return res.status(401).json({ success: false, message: "Ugyldig widget-nøkkel - lag en ny på profilen din" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Widget auth error:", error);
    res.status(500).json({ success: false, message: "Serverfeil" });
  }
};

// @desc    Everything the widgets show, in one small response
// @route   GET /api/widget
// @access  Widget key
exports.getWidgetData = async (req, res) => {
  try {
    const userId = req.user._id;
    const yearStart = new Date(new Date().getFullYear(), 0, 1);

    const [reading, readThisYear, meeting] = await Promise.all([
      UserBook.find({ user: userId, status: "currently-reading" }),
      UserBook.countDocuments({ user: userId, status: "read", finishedAt: { $gte: yearStart } }),
      // Meetings store the day in `date` (time separately), so keep today's
      // meeting around for the rest of the day
      Meeting.findOne({
        status: "upcoming",
        type: { $ne: "side" },
        date: { $gte: new Date(Date.now() - 18 * 60 * 60 * 1000) },
      })
        .sort({ date: 1 })
        .populate("book", "title author coverImage"),
    ]);

    const books = reading
      .filter((ub) => ub.book)
      .map((ub) => {
        const total = ub.pageCount || ub.book.pageCount || null;
        return {
          bookId: ub.book._id,
          title: ub.book.title,
          author: ub.book.author,
          coverImage: ub.book.coverImage || null,
          total,
          currentPage: ub.currentPage || 0,
          // null = hasn't logged progress yet (or no page count)
          percent:
            total && ub.progressUpdatedAt ? Math.min(100, Math.round(((ub.currentPage || 0) / total) * 100)) : null,
          progressUpdatedAt: ub.progressUpdatedAt,
          readingPlan: ub.readingPlan
            ? {
                targetDate: ub.readingPlan.targetDate,
                startPage: ub.readingPlan.startPage,
                startDate: ub.readingPlan.startDate,
              }
            : null,
          startedAt: ub.startedAt || ub.createdAt,
        };
      })
      // Planned books first (soonest deadline), then most recently updated
      .sort((a, b) => {
        const pa = a.readingPlan ? new Date(a.readingPlan.targetDate).getTime() : Infinity;
        const pb = b.readingPlan ? new Date(b.readingPlan.targetDate).getTime() : Infinity;
        if (pa !== pb) return pa - pb;
        return new Date(b.progressUpdatedAt || b.startedAt || 0) - new Date(a.progressUpdatedAt || a.startedAt || 0);
      });

    res.set("Cache-Control", "no-store");
    res.status(200).json({
      success: true,
      user: { displayName: req.user.displayName || req.user.username },
      reading: books,
      readingGoal: req.user.readingGoal || null,
      readThisYear,
      nextMeeting: meeting
        ? {
            id: meeting._id,
            title: meeting.title,
            date: meeting.date,
            time: meeting.time || null,
            location: meeting.location || null,
            attending: (meeting.attendees || []).some((a) => a.toString() === userId.toString()),
            book: meeting.book
              ? { id: meeting.book._id, title: meeting.book.title, author: meeting.book.author, coverImage: meeting.book.coverImage || null }
              : null,
          }
        : null,
    });
  } catch (error) {
    console.error("Widget data error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente widget-data" });
  }
};
