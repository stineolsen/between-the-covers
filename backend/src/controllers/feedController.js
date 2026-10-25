const mongoose = require("mongoose");
const FeedReaction = require("../models/FeedReaction");
const FeedComment = require("../models/FeedComment");
const Review = require("../models/Review");
const UserBook = require("../models/UserBook");
const AdventResult = require("../models/AdventResult");
const { FEED_ACTIVITY_TYPES, REACTION_EMOJI } = require("../constants/feedConfig");
const { createNotification } = require("../utils/notificationCenter");

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

// Who a reaction/comment on this feed item should notify, where clicking
// that notification should go, and a short noun phrase ("anmeldelsen din av
// «Title»") describing what the activity actually is - so the notification
// message can say what was reacted to/commented on, not just "aktiviteten
// din". Meetings have no single owner (a club-wide event, not one person's
// content) - reactions/comments on them just don't notify anyone, same as
// reacting to your own post doesn't (createNotification already no-ops when
// recipient === from).
async function getActivityOwnerAndLink(activityType, activityId) {
  if (activityType === "review") {
    const review = await Review.findById(activityId).select("user book").populate("book", "title");
    if (!review) return null;
    const bookId = review.book?._id || review.book;
    return {
      owner: review.user,
      link: bookId ? `/books/${bookId}` : "/books",
      context: review.book?.title ? `anmeldelsen din av «${review.book.title}»` : "anmeldelsen din",
    };
  }
  if (activityType === "status") {
    // UserBook auto-populates "book" via a pre(/^find/) hook (see
    // models/UserBook.js), so userBook.book is already a full document here
    // (with title, since that's in the hook's own populate select).
    const userBook = await UserBook.findById(activityId).select("user book");
    if (!userBook) return null;
    const bookId = userBook.book?._id || userBook.book;
    return {
      owner: userBook.user,
      link: bookId ? `/books/${bookId}` : "/books",
      context: userBook.book?.title ? `leseoppdateringen din om «${userBook.book.title}»` : "leseoppdateringen din",
    };
  }
  if (activityType === "advent") {
    const result = await AdventResult.findById(activityId).select("user adventDay").populate("adventDay", "day");
    if (!result) return null;
    // Never mention the book here - the whole point of the calendar is
    // guessing it, and the feed itself never reveals it either.
    return {
      owner: result.user,
      link: "/julekalender",
      context: result.adventDay?.day ? `julekalenderluken din (luke ${result.adventDay.day})` : "julekalenderluken din",
    };
  }
  return null;
}

async function reactionSummary(ref, userId) {
  const reactions = await FeedReaction.find(ref).populate("user", "username displayName");
  const byEmoji = new Map();
  for (const r of reactions) {
    if (!byEmoji.has(r.emoji)) byEmoji.set(r.emoji, { emoji: r.emoji, count: 0, reactedByMe: false, reactors: [] });
    const entry = byEmoji.get(r.emoji);
    entry.count += 1;
    entry.reactors.push(r.user?.displayName || r.user?.username || "Ukjent");
    if (r.user?._id?.toString() === userId.toString()) entry.reactedByMe = true;
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

      // Only on adding a reaction, never on removing one.
      getActivityOwnerAndLink(ref.activityType, ref.activityId)
        .then((ownerInfo) => {
          if (!ownerInfo) return;
          const reactorName = req.user.displayName || req.user.username;
          return createNotification({
            recipient: ownerInfo.owner,
            from: req.user._id,
            type: "feed-reaction",
            message: `${reactorName} reagerte ${emoji} på ${ownerInfo.context}`,
            link: ownerInfo.link,
          });
        })
        .catch((error) => console.error("Feed-reaction notification failed:", error));
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

    getActivityOwnerAndLink(ref.activityType, ref.activityId)
      .then((ownerInfo) => {
        if (!ownerInfo) return;
        const commenterName = req.user.displayName || req.user.username;
        // Reviews get their own notification type (you asked specifically
        // about review comments) - everything else is a generic feed comment.
        const type = ref.activityType === "review" ? "review-comment" : "feed-comment";
        return createNotification({
          recipient: ownerInfo.owner,
          from: req.user._id,
          type,
          message: `${commenterName} kommenterte på ${ownerInfo.context}: ${content.trim()}`,
          link: ownerInfo.link,
        });
      })
      .catch((error) => console.error("Feed-comment notification failed:", error));

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
