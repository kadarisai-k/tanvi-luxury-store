const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  // Photo Frames / Photo Albums only: which size the customer picked on the
  // product page, and that size's price *at the moment it was added* -
  // locked in here (rather than always looked up live from the product) so
  // the price shown in the bag never silently changes if the admin edits
  // pricing later, same principle as every other line-item price snapshot
  // in this app. Both blank for every other category.
  sizeLabel: { type: String, default: "", trim: true },
  sizePrice: { type: Number, default: null },
  // For Photo Frames / Photo Albums: chosen from the Cart page (see
  // Cart.jsx's "Add Photos" action), not at add-to-bag time. Each line item
  // gets a real Mongo _id (schema option removed below) so two entries of the
  // *same* product with two *different* Drive links can both exist in one cart
  // instead of being merged into a single quantity.
  driveLink: { type: String, default: "", trim: true },
  // "drive": customer pasted a Drive link in-app (driveLink is set).
  // "whatsapp": customer chose to send their photos via WhatsApp instead -
  // driveLink stays blank; staff follow up over WhatsApp.
  // "": no choice made yet.
  photoShareMethod: { type: String, enum: ["", "drive", "whatsapp"], default: "" },
});

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
