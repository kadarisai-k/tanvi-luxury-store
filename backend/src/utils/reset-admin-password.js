// One-off utility: resets (or creates) the admin login directly in the
// database. Bypasses seed.js's "skip if an admin already exists" behavior -
// use this whenever you need to be 100% sure the email/password in the
// database match what you intend to log in with.
//
// Usage:
//   node src/utils/reset-admin-password.js <email> <newPassword>
//
// Run from the backend/ folder, with your .env present (it connects to
// whatever MONGODB_URI is set there).

require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

async function run() {
  const [, , email, newPassword] = process.argv;

  if (!email || !newPassword) {
    console.error("Usage: node src/utils/reset-admin-password.js <email> <newPassword>");
    process.exit(1);
  }

  await connectDB();

  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const admin = await User.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        passwordHash,
        role: "admin",
        isActive: true,
      },
      $setOnInsert: { name: "Store Admin", email: normalizedEmail },
    },
    { upsert: true, new: true }
  );

  console.log(`Admin ready: ${admin.email} (role: ${admin.role})`);
  console.log("Password has been set to the value you just provided.");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
