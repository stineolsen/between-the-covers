const express = require("express");
const {
  getOverview,
  confirmBooks,
  getRankingList,
  markRankingDone,
  saveAwards,
  submit,
  getStatus,
} = require("../controllers/wrappedController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/:year/overview", getOverview);
router.put("/:year/confirm-books", confirmBooks);
router.get("/:year/ranking-list", getRankingList);
router.put("/:year/ranking-done", markRankingDone);
router.put("/:year/awards", saveAwards);
router.post("/:year/submit", submit);
router.get("/:year/status", getStatus);

module.exports = router;
