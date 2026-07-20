const bcrypt = require("bcryptjs");
const { z } = require("zod");
const User = require("../models/User");
const customerAuth = require("../services/customerAuthStore");
const { asyncHandler, ApiError } = require("../utils/apiError");
const { signAdminToken, signCustomerToken } = require("../utils/token");
const { sendOtpEmail } = require("../services/mailer");

function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  };
}

// ---------- CUSTOMER: send OTP ----------
const sendOtp = asyncHandler(async (req, res) => {
  const schema = z.object({ email: z.string().email() });
  const { email } = schema.parse(req.body);
  const normalizedEmail = email.toLowerCase().trim();

  if (customerAuth.isRateLimited(normalizedEmail)) {
    throw new ApiError(429, "Too many codes requested. Please try again in a while.");
  }
  if (customerAuth.resendTooSoon(normalizedEmail)) {
    throw new ApiError(429, "Please wait a few seconds before requesting another code.");
  }

  const otp = customerAuth.issueOtp(normalizedEmail);
  const { sent, devFallback } = await sendOtpEmail(normalizedEmail, otp);

  const response = { success: true, message: `OTP sent to ${normalizedEmail}`, sent };
  // Only present when mail isn't configured, so local dev/testing keeps working.
  if (devFallback) response.devOtp = otp;
  res.json(response);
});

// ---------- CUSTOMER: verify OTP ----------
const verifyOtp = asyncHandler(async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
    name: z.string().optional(),
  });
  const { email, otp, name } = schema.parse(req.body);
  const normalizedEmail = email.toLowerCase().trim();

  const result = customerAuth.checkOtp(normalizedEmail, otp);
  if (!result.ok) throw new ApiError(result.status, result.error);

  let user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    user = await User.create({ email: normalizedEmail, name: name || "", role: "customer" });
  } else if (name && !user.name) {
    user.name = name;
    await user.save();
  }

  const token = signCustomerToken(normalizedEmail);
  res.json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// ---------- CUSTOMER: get profile ----------
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// ---------- CUSTOMER: logout ----------
// Sessions are stateless JWTs now, so there's nothing to invalidate server
// -side — the frontend just drops the token from localStorage. This route
// stays so the frontend's existing logout call keeps working.
const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: "Logged out" });
});

// ---------- ADMIN: login (email + password) ----------
// Unchanged — still email+password with a JWT, since this isn't part of the
// OTP flow. Admin panel sends it as a Bearer token, not a cookie.
const adminLogin = asyncHandler(async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
  const { email, password } = schema.parse(req.body);

  const admin = await User.findOne({ email: email.toLowerCase().trim(), role: "admin" }).select(
    "+passwordHash"
  );
  if (!admin || !admin.passwordHash) throw new ApiError(401, "Invalid admin credentials");

  const match = await bcrypt.compare(password, admin.passwordHash);
  if (!match) throw new ApiError(401, "Invalid admin credentials");

  const token = signAdminToken(admin);
  res.cookie("adminToken", token, adminCookieOptions());
  res.json({
    success: true,
    token,
    admin: { id: admin._id, name: admin.name, email: admin.email },
  });
});

module.exports = { sendOtp, verifyOtp, getMe, logout, adminLogin };
