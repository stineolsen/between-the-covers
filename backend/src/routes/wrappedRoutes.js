const express = require("express");
const {
  getOverview,
  confirmBooks,
  getRankingList,
  markRankingDone,
  getQuestions,
  getBookclubBooks,
  saveAwards,
  submit,
  getStatus,
  getAdminWindow,
  setAdminWindow,
  getAdminQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  getAdminTally,
} = require("../controllers/wrappedController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/:year/overview", getOverview);
router.put("/:year/confirm-books", confirmBooks);
router.get("/:year/ranking-list", getRankingList);
router.put("/:year/ranking-done", markRankingDone);
router.get("/:year/questions", getQuestions);
router.get("/:year/bookclub-books", getBookclubBooks);
router.put("/:year/awards", saveAwards);
router.post("/:year/submit", submit);
router.get("/:year/status", getStatus);

router.get("/:year/admin/window", authorize("admin"), getAdminWindow);
router.put("/:year/admin/window", authorize("admin"), setAdminWindow);
router.get("/:year/admin/questions", authorize("admin"), getAdminQuestions);
router.post("/:year/admin/questions", authorize("admin"), createQuestion);
router.put("/:year/admin/questions/reorder", authorize("admin"), reorderQuestions);
router.put("/:year/admin/questions/:id", authorize("admin"), updateQuestion);
router.delete("/:year/admin/questions/:id", authorize("admin"), deleteQuestion);
router.get("/:year/admin/tally", authorize("admin"), getAdminTally);

module.exports = router;
