const crypto = require("crypto");
const User = require("../models/User");
const { sendTokenResponse } = require("../utils/tokens");

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email or username",
      });
    }

    // Create user with pending status
    const user = await User.create({
      username,
      email,
      password,
      displayName: displayName || username,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Registration successful! Your account is pending approval.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is approved
    if (user.status === "pending") {
      return res.status(403).json({
        success: false,
        message: "Your account is pending approval",
      });
    }

    if (user.status === "rejected") {
      return res.status(403).json({
        success: false,
        message: "Your account has been rejected",
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending users
// @route   GET /api/auth/pending
// @access  Private/Admin
exports.getPendingUsers = async (req, res, next) => {
  try {
    const users = await User.find({ status: "pending" }).select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject user
// @route   PUT /api/auth/approve/:id
// @access  Private/Admin
exports.approveUser = async (req, res, next) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "approved" or "rejected"',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.status = status;
    user.invitedBy = req.user.id; // Track who approved/rejected
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${status} successfully`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change own password (requires current password)
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin resets a user's password to a generated one
// @route   POST /api/auth/admin/reset-password/:id
// @access  Private/Admin
exports.adminResetPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate a random 12-character password
    const newPassword = crypto.randomBytes(6).toString("hex"); // 12 hex chars

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
      generatedPassword: newPassword,
    });
  } catch (error) {
    next(error);
  }
};
