const mongoose = require("mongoose");

const MAX_HOME_SECTION_PICKS = 8;

// Single-document collection holding site-wide settings that the admin can edit
// (e.g. the announcement bar text, and the hand-picked Featured / Best Sellers
// product lists on the storefront home page). We always read/write the one
// document with key "site" - see settingsController.js.
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "site" },
    announcementText: {
      type: String,
      default: "Complimentary shipping on orders above ₹999 · Handpicked with love from Hyderabad",
    },
    // Admin's manual pick for the home page "Featured Pieces" rail, in display
    // order. Empty = no manual pick, storefront falls back to random products
    // per section (see productController#getHomeSections).
    featuredProductIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      default: [],
      validate: {
        validator: (arr) => arr.length <= MAX_HOME_SECTION_PICKS,
        message: `You can select at most ${MAX_HOME_SECTION_PICKS} featured products.`,
      },
    },
    // Same idea, for the "Best Sellers" rail. Empty = fall back to actual
    // sales data, then to random products per section if nothing has sold.
    bestSellerProductIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      default: [],
      validate: {
        validator: (arr) => arr.length <= MAX_HOME_SECTION_PICKS,
        message: `You can select at most ${MAX_HOME_SECTION_PICKS} best seller products.`,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", settingSchema);
module.exports.MAX_HOME_SECTION_PICKS = MAX_HOME_SECTION_PICKS;
