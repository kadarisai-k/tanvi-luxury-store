const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      enum: ["kitchen", "jewellery", "photo_frames", "photo_albums"],
    },
    description: { type: String, default: "" },
    // GST percentage applied to products in this category at checkout.
    // e.g. 15 means 15% GST added on top of the item price.
    gstPercent: { type: Number, default: 0, min: 0, max: 100 },
    bannerImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
