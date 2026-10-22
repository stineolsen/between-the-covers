const Notification = require("../models/Notification");

// @desc    Most recent notifications for the logged-in user
// @route   GET /api/notifications?limit=20
// @access  Private
exports.getMyNotifications = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente varsler" });
  }
};

// @desc    Unread count, for the bell badge - kept separate from the list
//          fetch so the badge can poll cheaply without pulling full rows
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("Get unread notification count error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente antall uleste varsler" });
  }
};

// @desc    Mark one notification read (e.g. when clicked)
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true },
    );
    if (!notification) return res.status(404).json({ success: false, message: "Varselet ble ikke funnet" });
    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke oppdatere varselet" });
  }
};

// @desc    Mark every notification read (the dropdown's "mark all read")
// @route   PATCH /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke oppdatere varslene" });
  }
};

// @desc    Dismiss (delete) one notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    if (!notification) return res.status(404).json({ success: false, message: "Varselet ble ikke funnet" });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke slette varselet" });
  }
};
