const ListNotification = require("../models/ListNotification");

// @desc    Get list notifications (shares/comments) for the logged-in user
// @route   GET /api/list-notifications/mine
// @access  Private
exports.getMyListNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await ListNotification.find({
      recipients: userId,
      dismissedBy: { $ne: userId },
    })
      .sort({ createdAt: -1 })
      .populate("list", "title description")
      .populate("from", "displayName username avatar")
      .populate("comment", "content");

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Get list notifications error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente varsler" });
  }
};

// @desc    Dismiss a list notification
// @route   PATCH /api/list-notifications/:id/dismiss
// @access  Private
exports.dismissListNotification = async (req, res) => {
  try {
    const notification = await ListNotification.findOneAndUpdate(
      { _id: req.params.id, recipients: req.user._id },
      { $addToSet: { dismissedBy: req.user._id } },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Varsel ikke funnet" });
    }

    res.status(200).json({ success: true, message: "Varsel avvist" });
  } catch (error) {
    console.error("Dismiss list notification error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke avvise varsel" });
  }
};
