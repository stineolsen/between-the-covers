const express = require("express");
const { subscribe, unsubscribe } = require("../controllers/pushController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/subscribe", subscribe);
router.delete("/subscribe", unsubscribe);

module.exports = router;
