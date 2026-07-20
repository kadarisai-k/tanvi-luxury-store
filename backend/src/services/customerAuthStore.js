/*
 * Customer email-OTP auth store.
 *
 * In-memory by design: a plain Map is simpler than a Mongo collection + TTL
 * index for something this short-lived, and avoids a DB round-trip on every
 * OTP check. State resets on server restart, but that's fine here — an OTP
 * is only valid for a few minutes, so at worst a mid-login restart just
 * means the user requests a fresh code.
 *
 * Logged-in SESSIONS are no longer stored here — they're signed JWTs
 * (see utils/token.js: signCustomerToken/verifyCustomerToken), so a logged
 * -in customer stays logged in across server restarts/redeploys, which
 * matters a lot on free hosting tiers that spin the server down when idle.
 */

const crypto = require("crypto");

const otpStore = new Map(); // email -> { otp, expiresAt, attempts, lastSentAt }
const otpRequestLog = new Map(); // email -> [timestamps]  (per-email hourly rate limit)

const OTP_TTL_MS = (Number(process.env.OTP_EXPIRY_MINUTES) || 5) * 60 * 1000;
const OTP_RESEND_GAP_MS = 30 * 1000; // 30s between sends to the same email
const OTP_MAX_PER_HOUR = 5; // per email — keeps a stranger from spamming someone's inbox
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 5;

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000)); // 6-digit
}

function isRateLimited(email) {
  const now = Date.now();
  const list = (otpRequestLog.get(email) || []).filter((t) => now - t < 60 * 60 * 1000);
  otpRequestLog.set(email, list);
  return list.length >= OTP_MAX_PER_HOUR;
}

function resendTooSoon(email) {
  const existing = otpStore.get(email);
  return !!(existing && Date.now() - existing.lastSentAt < OTP_RESEND_GAP_MS);
}

function issueOtp(email) {
  const otp = generateOtp();
  otpStore.set(email, { otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0, lastSentAt: Date.now() });
  const log = otpRequestLog.get(email) || [];
  log.push(Date.now());
  otpRequestLog.set(email, log);
  return otp;
}

/**
 * Checks `otp` against the stored code for `email`.
 * Returns { ok: true } on success (and consumes the OTP), or
 * { ok: false, status, error } on failure.
 */
function checkOtp(email, otp) {
  const rec = otpStore.get(email);
  if (!rec || rec.expiresAt < Date.now()) {
    otpStore.delete(email);
    return { ok: false, status: 400, error: "OTP expired or not found. Please request a new one." };
  }
  if (rec.attempts >= OTP_MAX_ATTEMPTS) {
    otpStore.delete(email);
    return { ok: false, status: 429, error: "Too many incorrect attempts. Please request a new OTP." };
  }
  if (otp !== rec.otp) {
    rec.attempts += 1;
    return { ok: false, status: 400, error: "Incorrect OTP" };
  }
  otpStore.delete(email);
  return { ok: true };
}

module.exports = {
  isRateLimited,
  resendTooSoon,
  issueOtp,
  checkOtp,
};
