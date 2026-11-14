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
  getAdminVisibility,
  setAdminVisibility,
  getAdminQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  getAdminTally,
  getReleaseInfo,
  getLiveStats,
  getResults,
  getAdminRelease,
  setAdminRelease,
  getAdminMembers,
  setQuickRating,
  getMeetings,
  saveMeetings,
  shareResults,
  unshareResults,
  getYearShares,
  getUserShares,
} = require("../controllers/wrappedController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { requireFeatureVisible } = require("../utils/featureVisibility");

const router = express.Router();

router.use(protect);

const visible = requireFeatureVisible((req) => `wrapped:${req.params.year}:visibility`);

router.get("/:year/overview", visible, getOverview);
router.put("/:year/confirm-books", visible, confirmBooks);
router.get("/:year/ranking-list", visible, getRankingList);
router.put("/:year/ranking-done", visible, markRankingDone);
router.get("/:year/questions", visible, getQuestions);
router.get("/:year/bookclub-books", visible, getBookclubBooks);
router.put("/:year/awards", visible, saveAwards);
router.post("/:year/submit", visible, submit);
router.get("/:year/status", visible, getStatus);
router.put("/:year/rating", visible, setQuickRating);
router.get("/:year/meetings", visible, getMeetings);
router.put("/:year/meetings", visible, saveMeetings);

// Results side - gated by the release date instead of the collection
// visibility toggle (see getResults); live stats are open all year.
router.get("/:year/release", getReleaseInfo);
router.get("/:year/live", getLiveStats);
router.get("/:year/results", getResults);

// Sharing a summary with the club - shareResults checks the release itself
router.get("/shares/user/:userId", getUserShares);
router.get("/:year/shares", getYearShares);
router.post("/:year/share", shareResults);
router.delete("/:year/share", unshareResults);

router.get("/:year/admin/window", authorize("admin"), getAdminWindow);
router.put("/:year/admin/window", authorize("admin"), setAdminWindow);
router.get("/:year/admin/visibility", authorize("admin"), getAdminVisibility);
router.put("/:year/admin/visibility", authorize("admin"), setAdminVisibility);
router.get("/:year/admin/questions", authorize("admin"), getAdminQuestions);
router.post("/:year/admin/questions", authorize("admin"), createQuestion);
router.put("/:year/admin/questions/reorder", authorize("admin"), reorderQuestions);
router.put("/:year/admin/questions/:id", authorize("admin"), updateQuestion);
router.delete("/:year/admin/questions/:id", authorize("admin"), deleteQuestion);
router.get("/:year/admin/tally", authorize("admin"), getAdminTally);
router.get("/:year/admin/release", authorize("admin"), getAdminRelease);
router.put("/:year/admin/release", authorize("admin"), setAdminRelease);
router.get("/:year/admin/members", authorize("admin"), getAdminMembers);

module.exports = router;
