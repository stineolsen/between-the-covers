const { sendFeatureAlert } = require("../utils/emailService");

// @desc    Admin: broadcast an announcement email (e.g. new feature alert)
//          to everyone opted into feature alerts
// @route   POST /api/admin/notifications/feature-alert
// @access  Private (admin only)
exports.sendFeatureAlertEmail = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: "Tittel og melding er påkrevd" });
    }

    const result = await sendFeatureAlert({ subject: subject.trim(), message: message.trim() });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("Send feature alert error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke sende varsel" });
  }
};
