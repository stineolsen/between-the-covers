const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { uploadSingle } = require("../middleware/uploadMiddleware");
const {
  getMembers,
  getProfile,
  updateProfile,
  uploadAvatar,
  selectDefaultAvatar,
  deleteAvatar,
} = require("../controllers/userController");

// Members list (for recommendation recipient selection)
router.get("/members", protect, getMembers);

// Profile routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Avatar routes
router.post("/avatar", protect, uploadSingle("avatar"), uploadAvatar);
router.put("/avatar/default", protect, selectDefaultAvatar);
router.delete("/avatar", protect, deleteAvatar);

module.exports = router;
