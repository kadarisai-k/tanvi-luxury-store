// Standalone SMTP test - run with: node mailtest.js
// Change the "to" address below if you want, then check what it prints.
require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("Using these SMTP settings from .env:");
console.log("  HOST:", process.env.SMTP_HOST);
console.log("  PORT:", process.env.SMTP_PORT);
console.log("  USER:", process.env.SMTP_USER);
console.log("  PASS:", process.env.SMTP_PASS ? "(set, hidden)" : "(MISSING)");
console.log("  FROM:", process.env.SMTP_FROM);
console.log("");
console.log("Attempting to send a test email (waiting up to 10 seconds)...");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  connectionTimeout: 10000,
});

transporter
  .sendMail({
    from: process.env.SMTP_FROM,
    to: "kadarisaikumar6669@gmail.com",
    subject: "Tanvi Luxury Store - SMTP test",
    html: "<p>If you got this, your SMTP settings are working.</p>",
  })
  .then((info) => {
    console.log("");
    console.log("SUCCESS - email was accepted for delivery:");
    console.log(info);
  })
  .catch((err) => {
    console.log("");
    console.log("FAILED - here is exactly what went wrong:");
    console.log(err.message);
  });
