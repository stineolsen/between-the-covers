const Announcement = require("../models/Announcement");
const { sanitizeAnnouncementHtml } = require("../utils/htmlSanitize");

// Admin picks one of these rather than a raw date, so there's no chance of
// an admin accidentally setting an expiry in the past or a garbled date.
const DURATION_DAYS = {
  "1d": 1,
  "3d": 3,
  "1w": 7,
  "2w": 14,
  "1m": 30,
  forever: null,
};

// @desc    Active (non-expired) announcements, newest first
// @route   GET /api/announcements
// @access  Private
exports.getActive = async (req, res) => {
  try {
    const announcements = await Announcement.find({
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, announcements });
  } catch (error) {
    console.error("Get active announcements error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente meldinger" });
  }
};

// @desc    Every announcement (including expired), newest first - lets
//          admin see everything that currently exists, not just what's live
// @route   GET /api/announcements/admin
// @access  Private/Admin
exports.getAllForAdmin = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, announcements });
  } catch (error) {
    console.error("Get all announcements error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente meldinger" });
  }
};

// @desc    Add a new announcement
// @route   POST /api/announcements
// @access  Private/Admin
exports.createAnnouncement = async (req, res) => {
  try {
    const { html, duration } = req.body;
    const cleanHtml = sanitizeAnnouncementHtml(html);
    if (!cleanHtml) {
      return res.status(400).json({ success: false, message: "Meldingen kan ikke være tom" });
    }
    if (!Object.keys(DURATION_DAYS).includes(duration)) {
      return res.status(400).json({
        success: false,
        message: `Ugyldig varighet - må være en av: ${Object.keys(DURATION_DAYS).join(", ")}`,
      });
    }
    const days = DURATION_DAYS[duration];
    const expiresAt = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

    const announcement = await Announcement.create({
      html: cleanHtml,
      expiresAt,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, announcement });
  } catch (error) {
    console.error("Create announcement error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke lagre meldingen" });
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: "Meldingen ble ikke funnet" });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete announcement error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke slette meldingen" });
  }
};
