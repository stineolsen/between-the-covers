const mongoose = require("mongoose");
const FeedReaction = require("../models/FeedReaction");
const FeedComment = require("../models/FeedComment");
const { FEED_ACTIVITY_TYPES, REACTION_EMOJI } = require("../constants/feedConfig");

// Shared by every handler below - the (type, id) pair identifies a feed
// item (see FeedReaction.js for why), so every route here needs both
// validated before touching the database.
function parseActivityRef(req, res) {
  const { type, id } = req.params;
  if (!FEED_ACTIVITY_TYPES.includes(type)) {
    res.status(400).json({ success: false, message: "Ugyldig type" });
    return null;
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: "Ugyldig id" });
    return null;
  }
  return { activityType: type, activityId: id };
}

async function reactionSummary(ref, userId) {
  const reactions = await FeedReaction.find(ref);
  const byEmoji = new Map();
  for (const r of reactions) {
    if (!byEmoji.has(r.emoji)) byEmoji.set(r.emoji, { emoji: r.emoji, count: 0, reactedByMe: false });
    const entry = byEmoji.get(r.emoji);
    entry.count += 1;
    if (r.user.toString() === userId.toString()) entry.reactedByMe = true;
  }
  // Only emoji someone's actually used - the frontend shows these as
  // pills and offers the rest of REACTION_EMOJI through a separate picker
  // button, rather than rendering all eleven possible reactions per item.
  return Array.from(byEmoji.values());
}

// @desc    React (or un-react, if already reacted with this emoji) to a
//          feed item
// @route   POST /api/activity/:type/:id/reactions
// @access  Private
exports.toggleReaction = async (req, res) => {
  try {
    const ref = parseActivityRef(req, res);
    if (!ref) return;
    const { emoji } = req.body;
    if (!REACTION_EMOJI.includes(emoji)) {
      return res.status(400).json({ success: false, message: "Ugyldig reaksjon" });
    }

    const existing = await FeedReaction.findOneAndDelete({ ...ref, user: req.user._id, emoji });
    if (!existing) {
      await FeedReaction.create({ ...ref, user: req.user._id, emoji });
    }

    res.status(200).json({ success: true, reactions: await reactionSummary(ref, req.user._id) });
  } catch (error) {
    if (error.code === 11000) {
      // Lost a create/delete race against ourselves (double-click) -
      // harmless, the other request already landed the intended state.
      const ref = { activityType: req.params.type, activityId: req.params.id };
      return res.status(200).json({ success: true, reactions: await reactionSummary(ref, req.user._id) });
    }
    console.error("Toggle reaction error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke registrere reaksjonen" });
  }
};

// @desc    Comments on a feed item, oldest first
// @route   GET /api/activity/:type/:id/comments
// @access  Private
exports.getComments = async (req, res) => {
  try {
    const ref = parseActivityRef(req, res);
    if (!ref) return;
    const comments = await FeedComment.find(ref).sort({ createdAt: 1 });
    res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error("Get feed comments error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente kommentarer" });
  }
};

// @desc    Comment on a feed item
// @route   POST /api/activity/:type/:id/comments
// @access  Private
exports.createComment = async (req, res) => {
  try {
    const ref = parseActivityRef(req, res);
    if (!ref) return;
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: "Innhold er påkrevd" });
    }

    const comment = await FeedComment.create({ ...ref, user: req.user._id, content });
    await comment.populate("user", "username displayName avatar");
    res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error("Create feed comment error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: Object.values(error.errors).map((e) => e.message).join(", ") });
    }
    res.status(500).json({ success: false, message: "Klarte ikke legge til kommentar" });
  }
};

// @desc    Edit a feed comment
// @route   PUT /api/activity/comments/:commentId
// @access  Private (comment owner only)
exports.updateComment = async (req, res) => {
  try {
    const comment = await FeedComment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Kommentaren ble ikke funnet" });

    const ownerId = comment.user._id || comment.user;
    if (ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Du kan bare redigere dine egne kommentarer" });
    }

    if (req.body.content !== undefined) comment.content = req.body.content;
    await comment.save();
    res.status(200).json({ success: true, comment });
  } catch (error) {
    console.error("Update feed comment error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: Object.values(error.errors).map((e) => e.message).join(", ") });
    }
    res.status(500).json({ success: false, message: "Klarte ikke oppdatere kommentaren" });
  }
};

// @desc    Delete a feed comment
// @route   DELETE /api/activity/comments/:commentId
// @access  Private (comment owner or admin)
exports.deleteComment = async (req, res) => {
  try {
    const comment = await FeedComment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Kommentaren ble ikke funnet" });

    const ownerId = comment.user._id || comment.user;
    if (ownerId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Du har ikke tilgang til å slette denne kommentaren" });
    }

    await comment.deleteOne();
    res.status(200).json({ success: true, message: "Kommentaren ble slettet" });
  } catch (error) {
    console.error("Delete feed comment error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke slette kommentaren" });
  }
};
