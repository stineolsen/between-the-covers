const Comment = require("../models/Comment");
const List = require("../models/List");
const ListNotification = require("../models/ListNotification");
const { canViewList } = require("../utils/listPermissions");
const { notifyListComment } = require("../utils/emailService");

// @desc    Get comments for a list, or for one book within a list
// @route   GET /api/comments?listId=&bookId=
// @access  Private
exports.getComments = async (req, res) => {
  try {
    const { listId, bookId } = req.query;
    if (!listId) {
      return res.status(400).json({ success: false, message: "listId er påkrevd" });
    }

    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ success: false, message: "Listen ble ikke funnet" });
    }
    if (!canViewList(list, req.user._id)) {
      return res.status(403).json({ success: false, message: "Du har ikke tilgang til denne listen" });
    }

    const comments = await Comment.find({ list: listId, book: bookId || null }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, count: comments.length, comments });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente kommentarer" });
  }
};

// @desc    Comment on a list, or on a book within a list
// @route   POST /api/comments
// @access  Private
exports.createComment = async (req, res) => {
  try {
    const { listId, bookId, content } = req.body;
    if (!listId || !content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Liste og innhold er påkrevd" });
    }

    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ success: false, message: "Listen ble ikke funnet" });
    }
    if (!canViewList(list, req.user._id)) {
      return res.status(403).json({ success: false, message: "Du har ikke tilgang til denne listen" });
    }

    const comment = await Comment.create({
      list: listId,
      book: bookId || null,
      user: req.user._id,
      content,
    });
    await comment.populate("user", "username displayName avatar");

    // Notify the list owner + collaborators (not the commenter themself)
    const authorId = req.user._id.toString();
    const recipientIds = [list.owner, ...list.collaborators]
      .map((u) => (u._id ? u._id.toString() : u.toString()))
      .filter((id, index, all) => id !== authorId && all.indexOf(id) === index);

    if (recipientIds.length > 0) {
      await ListNotification.create({
        list: list._id,
        type: "comment",
        from: req.user._id,
        recipients: recipientIds,
        comment: comment._id,
      });

      notifyListComment(list, comment, req.user, recipientIds);
    }

    res.status(201).json({ success: true, message: "Kommentar lagt til", comment });
  } catch (error) {
    console.error("Create comment error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Klarte ikke legge til kommentar" });
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private (comment owner only)
exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Kommentaren ble ikke funnet" });
    }

    const commentUserId = comment.user._id || comment.user;
    if (commentUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Du kan bare redigere dine egne kommentarer" });
    }

    const { content } = req.body;
    if (content !== undefined) comment.content = content;

    await comment.save();

    res.status(200).json({ success: true, message: "Kommentaren ble oppdatert", comment });
  } catch (error) {
    console.error("Update comment error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Klarte ikke oppdatere kommentaren" });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private (comment owner or admin)
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Kommentaren ble ikke funnet" });
    }

    const commentUserId = comment.user._id || comment.user;
    if (commentUserId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Du har ikke tilgang til å slette denne kommentaren" });
    }

    await comment.deleteOne();

    res.status(200).json({ success: true, message: "Kommentaren ble slettet" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke slette kommentaren" });
  }
};
