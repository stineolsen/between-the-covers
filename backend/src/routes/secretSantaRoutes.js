const express = require("express");
const { getAdmin, draw, setOpen, reset, getMine } = require("../controllers/secretSantaController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/me", getMine);

router.get("/admin", authorize("admin"), getAdmin);
router.post("/admin/draw", authorize("admin"), draw);
router.put("/admin/open", authorize("admin"), setOpen);
router.delete("/admin", authorize("admin"), reset);

module.exports = router;
