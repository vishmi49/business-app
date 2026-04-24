const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Admin = require('../models/admin.model');

// ── Helper: create and send JWT cookie ─────────────────────────────────────
const sendTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

// ── @route   POST /api/auth/login ───────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const admin = await Admin.findOne({ email }).select('+password');

  if (!admin) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await admin.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  sendTokenCookie(res, token);

  res.status(200).json({
    message: 'Login successful',
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
    },
  });
};

// ── @route   POST /api/auth/logout ──────────────────────────────────────────
const logout = async (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};

// ── @route   POST /api/auth/forgot-password ─────────────────────────────────
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const admin = await Admin.findOne({ email });

  // Always respond with the same message whether the email exists or not.
  // This prevents attackers from discovering which emails are registered.
  if (!admin) {
    return res.status(200).json({
      message: 'If that email is registered, a reset link has been sent',
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  admin.passwordResetToken = hashedToken;
  admin.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await admin.save({ validateBeforeSave: false });

  // TODO: send email with resetToken once Resend is configured
  // The email will contain a link like:
  // http://localhost:3000/reset-password/<resetToken>
  console.log('Reset token (dev only):', resetToken);

  res.status(200).json({
    message: 'If that email is registered, a reset link has been sent',
  });
};

// ── @route   POST /api/auth/reset-password/:token ───────────────────────────
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'New password is required' });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const admin = await Admin.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password +passwordResetToken +passwordResetExpires');

  if (!admin) {
    return res.status(400).json({ message: 'Token is invalid or has expired' });
  }

  admin.password = password;
  admin.passwordResetToken = undefined;
  admin.passwordResetExpires = undefined;
  await admin.save();

  res.status(200).json({ message: 'Password reset successful' });
};

module.exports = { login, logout, forgotPassword, resetPassword };
