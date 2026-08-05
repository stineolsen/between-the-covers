const express = require("express");
const {
  getImportStatus,
  setCalibreImportSince,
  runCalibreImport,
  runAbsSync,
  runAbsListeningSync,
} = require("../controllers/importController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/status", getImportStatus);
router.post("/calibre/since", setCalibreImportSince);
router.post("/calibre/run", runCalibreImport);
router.post("/abs/run", runAbsSync);
router.post("/abs-listening/run", runAbsListeningSync);

module.exports = router;
