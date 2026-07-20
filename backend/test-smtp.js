// Standalone SMTP connection tester - run this directly to debug email issues
// without going through the full OTP flow.
//
// Usage:
//   node test-smtp.js youremail@example.com
//
// Reads SMTP_HOST/PORT/USER/PASS/FROM straight from your .env file.

require("dotenv").config();
const nodemailer = require("nodemailer");

const recipient = process.argv[2];

if (!recipient) {
  console.error("Usage: node test-smtp.js youremail@example.com");
  process.exit(1);
}

console.log("Testing SMTP connection with these settings:");
console.log("  HOST:", process.env.SMTP_HOST);
console.log("  PORT:", process.env.SMTP_PORT);
console.log("  USER:", process.env.SMTP_USER);
console.log("  PASS:", process.env.SMTP_PASS ? `${process.env.SMTP_PASS.length} characters` : "(not set)");
console.log("  FROM:", process.env.SMTP_FROM);
console.log("");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// First, just verify the connection/auth without sending anything.
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP connection/auth FAILED:");
    console.error(err.message);
    console.error("");
    console.error("This confirms the problem is your SMTP_USER/SMTP_PASS combo,");
    console.error("not the rest of the app. Go re-copy both values fresh from");
    console.error("Brevo -> Transactional -> Email -> Settings -> SMTP settings tab.");
    process.exit(1);
  }

  console.log("✅ SMTP connection/auth succeeded. Sending a test email now...");

  transporter.sendMail(
    {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipient,
      subject: "Test email from Tanvi Store backend",
      html: "<p>If you're reading this, your SMTP setup works correctly.</p>",
    },
    (sendErr, info) => {
      if (sendErr) {
        console.error("❌ Auth succeeded but SENDING failed:");
        console.error(sendErr.message);
        process.exit(1);
      }
      console.log("✅ Email sent successfully!");
      console.log("Message ID:", info.messageId);
      console.log("Check", recipient, "(and its spam folder) in the next minute or two.");
    }
  );
});
