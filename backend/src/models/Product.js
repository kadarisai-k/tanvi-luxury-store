const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const sizeVariantSchema = new mongoose.Schema(
  { label: { type: String, required: true, trim: true }, price: { type: Number, required: true, min: 0 } },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    description: { type: String, default: "" },
    images: { type: [imageSchema], default: [] },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    // Photo Frames / Photo Albums only: up to 8 selectable sizes, each with
    // its own price (e.g. "A5 (9.5x6)" -> 799). When present, this is what
    // the storefront's size dropdown is built from, and `price` above just
    // becomes the "starting from" / default price shown before a size is
    // picked. Empty for every other category.
    sizeVariants: {
      type: [sizeVariantSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 8,
        message: "A product can have at most 8 size variants.",
      },
    },
    stock: { type: Number, required: true, default: 0, min: 0 },
    sku: { type: String, trim: true },
    attributes: {
      material: String,
      dimensions: String,
      weight: String,
      color: String,
      capacity: String, // e.g. album page count, kitchen container size
    },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }, // soft delete / show-hide
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.virtual("discountPercent").get(function () {
  if (!this.mrp || this.mrp <= this.price) return 0;
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});
productSchema.set("toJSON", { virtuals: true });

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
