const { sendFeatureAlert } = require("../utils/emailService");
const { createNotification } = require("../utils/notificationCenter");
const PushSubscription = require("../models/PushSubscription");
const User = require("../models/User");

// Longest text shown in the notification bell / push before cutting it off
const MAX_NOTIFICATION_LENGTH = 180;

const shorten = (text) =>
  text.length > MAX_NOTIFICATION_LENGTH ? `${text.slice(0, MAX_NOTIFICATION_LENGTH - 1).trimEnd()}…` : text;

// @desc    Admin: broadcast an announcement (e.g. new feature alert) - an
//          email to everyone opted into feature alerts, plus an in-app
//          notification and a push to every approved member
// @route   POST /api/admin/notifications/feature-alert
// @access  Private (admin only)
exports.sendFeatureAlertEmail = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: "Tittel og melding er påkrevd" });
    }

    const result = await sendFeatureAlert({ subject: subject.trim(), message: message.trim() });

    // In-app + push for every approved member, the sending admin included
    // so they can see how it looks. Push only reaches members who have
    // allowed it on a device.
    const members = await User.find({ status: "approved" }).select("_id");
    const text = shorten(`${subject.trim()}: ${message.trim().replace(/\s+/g, " ")}`);
    let notified = 0;
    for (const member of members) {
      const created = await createNotification({
        recipient: member._id,
        // createNotification skips notifying someone about their own
        // action, so the sender's own copy goes out without a sender
        from: member._id.equals(req.user._id) ? null : req.user._id,
        type: "feature-alert",
        message: text,
        link: "/",
      }).catch((error) => console.error("Feature alert notification failed:", error));
      if (created) notified++;
    }
    const pushMembers = (await PushSubscription.distinct("user", { user: { $in: members.map((m) => m._id) } })).length;

    res.status(200).json({ success: true, ...result, notified, pushMembers });
  } catch (error) {
    console.error("Send feature alert error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke sende varsel" });
  }
};
