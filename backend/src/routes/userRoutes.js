const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { uploadSingle } = require("../middleware/uploadMiddleware");
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  selectDefaultAvatar,
  deleteAvatar,
} = require("../controllers/userController");

// Profile routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Avatar routes
router.post("/avatar", protect, uploadSingle("avatar"), uploadAvatar);
router.put("/avatar/default", protect, selectDefaultAvatar);
router.delete("/avatar", protect, deleteAvatar);

module.exports = router;
