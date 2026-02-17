const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Send token as HTTP-only cookie
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id, user.role);

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true, // Cannot be accessed via JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict' // CSRF protection
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        status: user.status
      },
      token
    });
};

module.exports = {
  generateToken,
  verifyToken,
  sendTokenResponse
};
