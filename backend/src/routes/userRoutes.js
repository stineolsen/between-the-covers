const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { uploadSingle } = require("../middleware/uploadMiddleware");
const {
  getMembers,
  getProfile,
  updateProfile,
  uploadAvatar,
  selectDefaultAvatar,
  deleteAvatar,
  getPublicProfile,
  setAbsUsername,
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

// Public profile route
router.get("/:userId/profile", protect, getPublicProfile);

// Admin: link a member's Audiobookshelf username
router.put("/:userId/abs-username", protect, authorize("admin"), setAbsUsername);

module.exports = router;
