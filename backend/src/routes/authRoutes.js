const express = require("express");
const { sendOtp, verifyOtp, getMe, logout, adminLogin } = require("../controllers/authController");
const { requireCustomerAuth } = require("../middleware/auth");
const { otpRequestLimiter, otpVerifyLimiter, adminLoginLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// Customer OTP auth
router.post("/send-otp", otpRequestLimiter, sendOtp);
router.post("/verify-otp", otpVerifyLimiter, verifyOtp);
router.get("/me", requireCustomerAuth, getMe);
router.post("/logout", logout);

// Admin auth (email + password)
router.post("/admin-login", adminLoginLimiter, adminLogin);

module.exports = router;
