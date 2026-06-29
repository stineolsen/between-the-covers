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
    const { displayName, bio, favoriteGenres, notificationFrequency } = req.body;

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
    if (notificationFrequency !== undefined) {
      const validValues = User.schema.path("notificationFrequency").enumValues;
      if (!validValues.includes(notificationFrequency)) {
        return res.status(400).json({
          success: false,
          message: `notificationFrequency must be one of: ${validValues.join(", ")}`,
        });
      }
      user.notificationFrequency = notificationFrequency;
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

// @desc    Get public profile for a member
// @route   GET /api/users/:userId/profile
// @access  Private
exports.getPublicProfile = async (req, res, next) => {
  try {
    const UserBook = require('../models/UserBook');
    const Review = require('../models/Review');

    const user = await User.findById(req.params.userId)
      .select('displayName username avatar bio favoriteGenres role status');
    if (!user) return res.status(404).json({ success: false, message: 'Bruker ikke funnet' });

    // Build tags
    const tags = [];
    if (user.role === 'admin') tags.push('admin');
    if (user.status === 'approved') tags.push('godkjent');

    const [readCount, reviewCount, topReaders, topReviewers] = await Promise.all([
      UserBook.countDocuments({ user: user._id, status: 'read' }),
      Review.countDocuments({ user: user._id }),
      UserBook.aggregate([
        { $match: { status: 'read' } },
        { $group: { _id: '$user', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 2 },
      ]),
      Review.aggregate([
        { $group: { _id: '$user', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 2 },
      ]),
    ]);

    const userId = user._id.toString();
    if (topReaders.some((r) => r._id.toString() === userId)) tags.push('top-leser');
    if (topReviewers.some((r) => r._id.toString() === userId)) tags.push('top-anmelder');

    // Owned books (bookshelf) — book auto-populated by UserBook pre-find middleware
    const bookshelf = await UserBook.find({ user: user._id, owned: true }).sort({ updatedAt: -1 }).lean();

    // Highest-rated reviews → favorite books
    const favoriteReviews = await Review.find({ user: user._id })
      .sort({ rating: -1 })
      .limit(6)
      .populate('book', 'title author coverImage')
      .lean();
    const favoriteBooks = favoriteReviews.map(r => ({ book: r.book, rating: r.rating }));

    res.status(200).json({
      success: true,
      user,
      tags,
      readCount,
      reviewCount,
      bookshelf: bookshelf.map(ub => ({ book: ub.book })),
      favoriteBooks,
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
