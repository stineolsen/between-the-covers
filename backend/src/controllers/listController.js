const List = require("../models/List");
const Book = require("../models/Book");
const Comment = require("../models/Comment");
const ListNotification = require("../models/ListNotification");
const User = require("../models/User");
const { canViewList, canEditList } = require("../utils/listPermissions");
const { notifyListShared } = require("../utils/emailService");

const bookIdOf = (entry) => (entry.book && entry.book._id ? entry.book._id.toString() : entry.book.toString());

// @desc    Browse public lists
// @route   GET /api/lists
// @access  Private
exports.getLists = async (req, res) => {
  try {
    const { search, sort = "newest" } = req.query;

    const query = { visibility: "public" };
    if (search) {
      query.title = new RegExp(search, "i");
    }

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "title") sortOption = { title: 1 };

    const lists = await List.find(query).sort(sortOption);

    res.status(200).json({ success: true, count: lists.length, lists });
  } catch (error) {
    console.error("Get lists error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente lister" });
  }
};

// @desc    Get lists the logged-in user owns or collaborates on
// @route   GET /api/lists/mine
// @access  Private
exports.getMyLists = async (req, res) => {
  try {
    const userId = req.user._id;
    const lists = await List.find({
      $or: [{ owner: userId }, { collaborators: userId }],
    }).sort({ updatedAt: -1 });

    res.status(200).json({ success: true, count: lists.length, lists });
  } catch (error) {
    console.error("Get my lists error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente dine lister" });
  }
};

// @desc    Get a single list
// @route   GET /api/lists/:id
// @access  Private
exports.getList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ success: false, message: "Listen ble ikke funnet" });
    }

    if (!canViewList(list, req.user._id)) {
      return res.status(403).json({ success: false, message: "Du har ikke tilgang til denne listen" });
    }

    res.status(200).json({ success: true, list });
  } catch (error) {
    console.error("Get list error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente listen" });
  }
};

// @desc    Create a list
// @route   POST /api/lists
// @access  Private
exports.createList = async (req, res) => {
  try {
    const { title, description, notes, visibility } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Tittel er påkrevd" });
    }

    const list = await List.create({
      title,
      description,
      notes,
      visibility: visibility === "public" ? "public" : "private",
      owner: req.user._id,
    });

    const populated = await List.findById(list._id);

    res.status(201).json({ success: true, message: "Liste opprettet", list: populated });
  } catch (error) {
    console.error("Create list error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Klarte ikke opprette listen" });
  }
};

// @desc    Update a list's title/description/notes/visibility
// @route   PUT /api/lists/:id
// @access  Private (owner or collaborator)
exports.updateList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ success: false, message: "Listen ble ikke funnet" });
    }

    if (!canEditList(list, req.user._id)) {
      return res.status(403).json({ success: false, message: "Du har ikke tilgang til å redigere denne listen" });
    }

    const { title, description, notes, visibility } = req.body;

    if (title !== undefined) list.title = title;
    if (description !== undefined) list.description = description;
    if (notes !== undefined) list.notes = notes;
    if (visibility !== undefined) {
      if (!["private", "public"].includes(visibility)) {
        return res.status(400).json({ success: false, message: "Ugyldig synlighet" });
      }
      list.visibility = visibility;
    }

    await list.save();
    const populated = await List.findById(list._id);

    res.status(200).json({ success: true, message: "Listen ble oppdatert", list: populated });
  } catch (error) {
    console.error("Update list error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Klarte ikke oppdatere listen" });
  }
};

// @desc    Delete a list
// @route   DELETE /api/lists/:id
// @access  Private (owner only)
exports.deleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ success: false, message: "Listen ble ikke funnet" });
    }

    if (list.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Bare eieren kan slette listen" });
    }

    await Promise.all([
      Comment.deleteMany({ list: list._id }),
      ListNotification.deleteMany({ list: list._id }),
      list.deleteOne(),
    ]);

    res.status(200).json({ success: true, message: "Listen ble slettet" });
  } catch (error) {
    console.error("Delete list error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke slette listen" });
  }
};

// @desc    Add a book to a list
// @route   POST /api/lists/:id/books
// @access  Private (owner or collaborator)
exports.addBookToList = async (req, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ success: false, message: "Bok er påkrevd" });
    }

    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ success: false, message: "Listen ble ikke funnet" });
    }
    if (!canEditList(list, req.user._id)) {
      return res.status(403).json({ success: false, message: "Du har ikke tilgang til å redigere denne listen" });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: "Boken ble ikke funnet" });
    }

    if (list.books.some((entry) => bookIdOf(entry) === bookId)) {
      return res.status(400).json({ success: false, message: "Boken er allerede på listen" });
    }

    list.books.push({ book: bookId, addedBy: req.user._id });
    await list.save();
    const populated = await List.findById(list._id);

    res.status(200).json({ success: true, message: "Boken ble lagt til", list: populated });
  } catch (error) {
    console.error("Add book to list error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke legge til boken" });
  }
};

// @desc    Remove a book from a list
// @route   DELETE /api/lists/:id/books/:bookId
// @access  Private (owner or collaborator)
exports.removeBookFromList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ success: false, message: "Listen ble ikke funnet" });
    }
    if (!canEditList(list, req.user._id)) {
      return res.status(403).json({ success: false, message: "Du har ikke tilgang til å redigere denne listen" });
    }

    list.books = list.books.filter((entry) => bookIdOf(entry) !== req.params.bookId);
    await list.save();
    const populated = await List.findById(list._id);

    res.status(200).json({ success: true, message: "Boken ble fjernet", list: populated });
  } catch (error) {
    console.error("Remove book from list error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke fjerne boken" });
  }
};

// @desc    Reorder the books in a list (drag-and-drop ranking)
// @route   PATCH /api/lists/:id/books/reorder
// @access  Private (owner or collaborator)
exports.reorderBooks = async (req, res) => {
  try {
    const { orderedBookIds } = req.body;
    if (!Array.isArray(orderedBookIds)) {
      return res.status(400).json({ success: false, message: "orderedBookIds må være en liste" });
    }

    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ success: false, message: "Listen ble ikke funnet" });
    }
    if (!canEditList(list, req.user._id)) {
      return res.status(403).json({ success: false, message: "Du har ikke tilgang til å redigere denne listen" });
    }

    const currentIds = list.books.map(bookIdOf);
    const sameSet =
      orderedBookIds.length === currentIds.length &&
      currentIds.every((id) => orderedBookIds.includes(id)) &&
      orderedBookIds.every((id) => currentIds.includes(id));

    if (!sameSet) {
      return res.status(400).json({
        success: false,
        message: "Rekkefølgen må inneholde nøyaktig de samme bøkene som allerede er på listen",
      });
    }

    const entriesById = new Map(list.books.map((entry) => [bookIdOf(entry), entry]));
    list.books = orderedBookIds.map((id) => entriesById.get(id));

    await list.save();
    const populated = await List.findById(list._id);

    res.status(200).json({ success: true, message: "Rekkefølgen ble oppdatert", list: populated });
  } catch (error) {
    console.error("Reorder books error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke oppdatere rekkefølgen" });
  }
};

// @desc    Add collaborators to a list (full edit rights)
// @route   POST /api/lists/:id/collaborators
// @access  Private (owner or collaborator)
exports.addCollaborators = async (req, res) => {
  try {
    const { userIds, message } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: "Velg minst én bruker å dele med" });
    }

    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ success: false, message: "Listen ble ikke funnet" });
    }
    if (!canEditList(list, req.user._id)) {
      return res.status(403).json({ success: false, message: "Du har ikke tilgang til å redigere denne listen" });
    }

    const ownerId = list.owner._id.toString();
    const existingCollaboratorIds = list.collaborators.map((c) => (c._id ? c._id.toString() : c.toString()));

    const newCollaboratorIds = [...new Set(userIds)].filter(
      (id) => id !== ownerId && !existingCollaboratorIds.includes(id),
    );

    if (newCollaboratorIds.length === 0) {
      return res.status(400).json({ success: false, message: "Ingen nye samarbeidspartnere å legge til" });
    }

    list.collaborators.push(...newCollaboratorIds);
    await list.save();

    // Notify the newly added collaborators (in-app + email), fire-and-forget for email
    const notification = await ListNotification.create({
      list: list._id,
      type: "shared",
      from: req.user._id,
      recipients: newCollaboratorIds,
      message: message?.trim() || undefined,
    });

    notifyListShared(list, req.user, newCollaboratorIds);

    const populated = await List.findById(list._id);

    res.status(200).json({
      success: true,
      message: "Listen ble delt",
      list: populated,
      notification,
    });
  } catch (error) {
    console.error("Add collaborators error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke dele listen" });
  }
};

// @desc    Remove a collaborator from a list
// @route   DELETE /api/lists/:id/collaborators/:userId
// @access  Private (owner or collaborator)
exports.removeCollaborator = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ success: false, message: "Listen ble ikke funnet" });
    }
    if (!canEditList(list, req.user._id)) {
      return res.status(403).json({ success: false, message: "Du har ikke tilgang til å redigere denne listen" });
    }

    list.collaborators = list.collaborators.filter(
      (c) => (c._id ? c._id.toString() : c.toString()) !== req.params.userId,
    );
    await list.save();
    const populated = await List.findById(list._id);

    res.status(200).json({ success: true, message: "Samarbeidspartner fjernet", list: populated });
  } catch (error) {
    console.error("Remove collaborator error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke fjerne samarbeidspartner" });
  }
};
