require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Category = require("../models/Category");
const User = require("../models/User");

const CATEGORIES = [
  { name: "Kitchen", slug: "kitchen", description: "Premium kitchen essentials and decor" },
  { name: "Jewellery", slug: "jewellery", description: "Elegant jewellery pieces" },
  { name: "Photo Frames", slug: "photo_frames", description: "Beautiful photo frames" },
  { name: "Photo Albums", slug: "photo_albums", description: "Luxury photo albums" },
];

async function seed() {
  await connectDB();

  for (const cat of CATEGORIES) {
    await Category.findOneAndUpdate(
      { slug: cat.slug },
      { $setOnInsert: cat },
      { upsert: true, new: true }
    );
  }
  console.log("Categories seeded (Kitchen, Jewellery, Photo Frames, Photo Albums)");

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@tanvistore.com").toLowerCase();
  const existingAdmin = await User.findOne({ email: adminEmail, role: "admin" });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "ChangeMe123!", 10);
    await User.create({
      email: adminEmail,
      name: process.env.ADMIN_NAME || "Store Admin",
      role: "admin",
      passwordHash,
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log("Admin user already exists, skipping.");
  }

  await mongoose.disconnect();
  console.log("Seeding complete.");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
