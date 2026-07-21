const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    title: String,
    image: String,
    category: String, // slug snapshot, useful for category-wise reports
    price: Number,
    quantity: Number,
    // Photo Frames / Photo Albums only: which size was ordered (e.g. "A5
    // (9.5x6)"). `price` above already reflects that size's price.
    sizeLabel: { type: String, default: "" },
    gstPercent: { type: Number, default: 0 }, // category's GST rate at time of order
    gstAmount: { type: Number, default: 0 }, // GST charged on this line (price * qty * gstPercent / 100)
    // Google Drive link the customer supplied for Photo Frames / Photo Albums
    // products, so staff can open it, download the photo(s), print, and fit
    // them into the selected frame/album before dispatch.
    driveLink: { type: String, default: "" },
    // "drive" | "whatsapp" | "" - see Cart.js for what each means.
    photoShareMethod: { type: String, default: "" },
  },
  { _id: false }
);

const addressSnapshotSchema = new mongoose.Schema(
  {
    name: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    phone: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: addressSnapshotSchema, required: true },

    subtotal: { type: Number, required: true },
    gstTotal: { type: Number, default: 0 }, // sum of items[].gstAmount
    shippingFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    paymentInfo: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      method: { type: String, enum: ["cod", "razorpay"], required: true },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
    },

    orderStatus: {
      type: String,
      enum: ["placed", "confirmed", "shipped", "delivered", "cancelled"],
      default: "placed",
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],

    placedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

orderSchema.index({ placedAt: -1 });
orderSchema.index({ user: 1 });

module.exports = mongoose.model("Order", orderSchema);
