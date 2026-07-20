/*
 * Email delivery — Gmail SMTP via Nodemailer.
 *
 * Why Gmail SMTP instead of a transactional-email API (Brevo, SendGrid, etc.)?
 * Those give a small free tier and then charge, and (as this project found
 * out) a rented sender domain/relay can silently fail to authenticate. A
 * regular Gmail account sends roughly 500 emails/day through SMTP with NO
 * bill, using an account you fully control. For a single store's OTP +
 * order-update volume that is, in practice, unlimited.
 *
 * Setup (2 minutes, no cost):
 *   1. Use any Gmail address (a fresh one just for the store is a good idea).
 *   2. Turn on 2-Step Verification: https://myaccount.google.com/security
 *   3. Create an "App Password": https://myaccount.google.com/apppasswords
 *      (choose app "Mail", device "Other" -> name it "Tanvi Store")
 *   4. Put the 16-character app password (NOT your normal Gmail password)
 *      into backend/.env as GMAIL_APP_PASSWORD, and the address as GMAIL_USER.
 *
 * With no .env configured at all, emails are printed to the server console
 * instead of sent — so OTP login still works end-to-end during local dev
 * without any SMTP setup.
 */

/*
 * Email delivery — Brevo HTTP API (primary) with Gmail SMTP as a local-dev
 * fallback.
 *
 * Why not just Gmail SMTP everywhere? Render's free tier blocks outbound
 * traffic on SMTP ports 25/465/587 entirely (a platform-wide anti-spam
 * policy since Sept 2025) — so Gmail SMTP times out in production no matter
 * how correctly it's configured. Brevo's API sends over regular HTTPS
 * (port 443), which isn't blocked, and its free tier (300 emails/day) is
 * more than enough for a single store's OTP + order-update volume.
 *
 * Brevo setup (~3 minutes, no cost):
 *   1. Sign up at https://app.brevo.com/ (free).
 *   2. Settings -> SMTP & API -> API Keys -> Generate a new API key.
 *   3. Senders, Domains & Dedicated IPs -> Senders -> Add a Sender (use the
 *      same Gmail address, or any address you control) -> verify it via the
 *      confirmation email Brevo sends.
 *   4. Put the API key into backend/.env (and Render's environment) as
 *      BREVO_API_KEY, and the verified sender address as BREVO_SENDER_EMAIL.
 *
 * With no BREVO_API_KEY set, this falls back to Gmail SMTP (works fine for
 * local development, where SMTP isn't blocked). With neither configured,
 * emails are printed to the console instead — so OTP login still works
 * end-to-end without any setup at all.
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER || "";
const GMAIL_USER = process.env.GMAIL_USER || "";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "";
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || "Tanvi Luxury Store";

const BREVO_CONFIGURED = !!(BREVO_API_KEY && BREVO_SENDER_EMAIL);
const GMAIL_CONFIGURED = !!(GMAIL_USER && GMAIL_APP_PASSWORD);
const MAIL_CONFIGURED = BREVO_CONFIGURED || GMAIL_CONFIGURED;

let transporter = null;
function getTransporter() {
  if (!GMAIL_CONFIGURED) return null;
  if (transporter) return transporter;
  const nodemailer = require("nodemailer");
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
  return transporter;
}

async function sendViaBrevo({ to, subject, html, text }) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: MAIL_FROM_NAME, email: BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo API responded ${res.status}: ${body}`);
  }
}

/**
 * Sends `html`/`subject` to `to`. Returns { sent, devFallback }.
 * When mail isn't configured (or sending fails), logs to the console
 * instead of throwing, so the app keeps working without email set up.
 * Order-status emails are non-critical (the order is already placed), so
 * callers there can ignore devFallback; OTP emails should surface it.
 */
async function sendMail({ to, subject, html, text }) {
  if (!MAIL_CONFIGURED) {
    console.log(`[mailer] No email provider configured — email to ${to} ("${subject}") was not sent.`);
    return { sent: false, devFallback: true };
  }
  try {
    if (BREVO_CONFIGURED) {
      await sendViaBrevo({ to, subject, html, text });
    } else {
      await getTransporter().sendMail({
        from: `"${MAIL_FROM_NAME}" <${GMAIL_USER}>`,
        to,
        subject,
        html,
        text,
      });
    }
    return { sent: true, devFallback: false };
  } catch (e) {
    console.error(`[mailer] failed to send email to ${to}:`, e.message);
    return { sent: false, devFallback: true };
  }
}

function otpEmailHtml(otp) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:420px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:12px">
    <h2 style="color:#1a1a1a;margin:0 0 8px">${MAIL_FROM_NAME}</h2>
    <p style="margin:0 0 20px;color:#444">Your one-time login code is:</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:6px;background:#f6f4f0;color:#1a1a1a;text-align:center;padding:16px;border-radius:10px">${otp}</div>
    <p style="margin:20px 0 0;color:#888;font-size:13px">This code expires in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes. If you didn't request it, you can ignore this email.</p>
  </div>`;
}

/**
 * Sends a login OTP to `email`. Returns { sent, devFallback }.
 * When devFallback is true, the caller should include the OTP in the API
 * response (dev-only) so login keeps working without SMTP configured.
 */
async function sendOtpEmail(email, otp) {
  return sendMail({
    to: email,
    subject: `${otp} is your login code`,
    html: otpEmailHtml(otp),
    text: `Your login code is ${otp}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.`,
  });
}

async function sendOrderStatusEmail(email, order) {
  const statusText = {
    placed: "Your order has been placed",
    confirmed: "Your order has been confirmed",
    shipped: "Your order has been shipped",
    delivered: "Your order has been delivered",
    cancelled: "Your order has been cancelled",
  }[order.orderStatus];

  return sendMail({
    to: email,
    subject: `Order ${order.orderNumber}: ${statusText}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>${statusText}</h2>
        <p>Order number: <strong>${order.orderNumber}</strong></p>
        <p>Total amount: ₹${order.totalAmount}</p>
        <p>Current status: <strong>${order.orderStatus}</strong></p>
        <p>Thank you for shopping with ${MAIL_FROM_NAME}.</p>
      </div>
    `,
  });
}

module.exports = { sendMail, sendOtpEmail, sendOrderStatusEmail, MAIL_CONFIGURED };
