const User = require("../models/User");
const path = require("path");
const fs = require("fs");

// @desc    Get all approved club members (for recipient selection)
// @route   GET /api/users/members
// @access  Private
exports.getMembers = async (req, res, next) => {
  try {
    const members = await User.find({ status: 'approved' })
      .select('_id displayName username avatar')
      .sort({ displayName: 1 });
    res.status(200).json({ success: true, members });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { displayName, bio, favoriteGenres } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update allowed fields
    if (displayName !== undefined) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (favoriteGenres !== undefined) {
      if (typeof favoriteGenres === "string") {
        user.favoriteGenres = favoriteGenres.split(",").map((g) => g.trim());
      } else {
        user.favoriteGenres = favoriteGenres;
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload/Update user avatar
// @route   POST /api/users/avatar
// @access  Private
exports.uploadAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      // Delete uploaded file if user not found
      if (req.file) {
        const filePath = path.join(
          __dirname,
          "../../uploads/avatars",
          req.file.filename,
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file",
      });
    }

    // Delete old avatar if it exists and is not a default avatar
    if (user.avatar && !user.avatar.startsWith("default-")) {
      const oldAvatarPath = path.join(
        __dirname,
        "../../uploads/avatars",
        user.avatar,
      );
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    user.avatar = req.file.filename;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      avatar: user.avatar,
    });
  } catch (error) {
    // If there was an error, delete uploaded file
    if (req.file) {
      const filePath = path.join(
        __dirname,
        "../../uploads/avatars",
        req.file.filename,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(error);
  }
};

// @desc    Select default avatar
// @route   PUT /api/users/avatar/default
// @access  Private
exports.selectDefaultAvatar = async (req, res, next) => {
  try {
    const { avatarName } = req.body;

    if (!avatarName) {
      return res.status(400).json({
        success: false,
        message: "Please provide an avatar name",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete old avatar if it exists and is not a default avatar
    if (user.avatar && !user.avatar.startsWith("default-")) {
      const oldAvatarPath = path.join(
        __dirname,
        "../../uploads/avatars",
        user.avatar,
      );
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    user.avatar = avatarName;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      avatar: user.avatar,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user avatar
// @route   DELETE /api/users/avatar
// @access  Private
exports.deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete avatar file if it exists and is not a default avatar
    if (user.avatar && !user.avatar.startsWith("default-")) {
      const avatarPath = path.join(
        __dirname,
        "../../uploads/avatars",
        user.avatar,
      );
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    user.avatar = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
