const express = require("express");
const {
  getLists,
  getMyLists,
  getList,
  createList,
  updateList,
  deleteList,
  addBookToList,
  removeBookFromList,
  reorderBooks,
  addCollaborators,
  removeCollaborator,
} = require("../controllers/listController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getLists);
router.get("/mine", getMyLists);
router.get("/:id", getList);
router.post("/", createList);
router.put("/:id", updateList);
router.delete("/:id", deleteList);

router.post("/:id/books", addBookToList);
router.delete("/:id/books/:bookId", removeBookFromList);
router.patch("/:id/books/reorder", reorderBooks);

router.post("/:id/collaborators", addCollaborators);
router.delete("/:id/collaborators/:userId", removeCollaborator);

module.exports = router;
