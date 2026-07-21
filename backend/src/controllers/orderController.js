const { z } = require("zod");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { asyncHandler, ApiError } = require("../utils/apiError");
const {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
} = require("../services/razorpayService");
const { sendOrderStatusEmail } = require("../services/mailer");

const SHIPPING_FEE = 0; // flat free shipping for v1 - adjust as needed

// Indian mobile numbers: exactly 10 digits, starting 6-9. Strips spaces/dashes
// before validating so "98765 43210" and "9876543210" both pass, but anything
// shorter/longer or non-numeric is rejected.
const addressSchema = z.object({
  name: z.string().min(2),
  line1: z.string().min(2),
  line2: z.string().optional().default(""),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Phone number must be exactly 10 digits")),
});

async function generateOrderNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const countToday = await Order.countDocuments({
    orderNumber: { $regex: `^TLX-${datePart}` },
  });
  const seq = String(countToday + 1).padStart(4, "0");
  return `TLX-${datePart}-${seq}`;
}

// Shared by both the Razorpay and COD paths: loads the user's cart, re-validates
// stock/availability, and builds the order-item snapshot + subtotal server-side.
// Never trust a total or item list sent from the frontend.
async function loadCartForOrder(userId) {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    populate: { path: "category" },
  });
  if (!cart || cart.items.length === 0) throw new ApiError(400, "Cart is empty");

  let subtotal = 0;
  let gstTotal = 0;
  const orderItems = cart.items.map((item) => {
    if (!item.product || !item.product.isActive) {
      throw new ApiError(400, `Product ${item.product?.title || ""} is no longer available`);
    }
    if (item.product.stock < item.quantity) {
      throw new ApiError(400, `Insufficient stock for ${item.product.title}`);
    }
    const effectivePrice = item.sizePrice ?? item.product.price;
    const lineTotal = effectivePrice * item.quantity;
    const gstPercent = item.product.category?.gstPercent || 0;
    // GST is always calculated server-side from the category's rate at the
    // time of order - never trust a GST amount sent from the frontend.
    const gstAmount = Math.round((lineTotal * gstPercent) / 100);
    subtotal += lineTotal;
    gstTotal += gstAmount;
    return {
      product: item.product._id,
      title: item.product.title,
      image: item.product.images?.[0]?.url || "",
      category: item.product.category?.slug || item.product.category?.toString(),
      price: effectivePrice,
      sizeLabel: item.sizeLabel || "",
      quantity: item.quantity,
      gstPercent,
      gstAmount,
      driveLink: item.driveLink || "",
      photoShareMethod: item.photoShareMethod || "",
    };
  });

  return { cart, orderItems, subtotal, gstTotal };
}

// Decrements stock and clears the cart after an order is successfully created.
async function finalizeCartAfterOrder(cart) {
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
  }
  cart.items = [];
  await cart.save();
}

// STEP 1: Recompute cart total server-side and create a Razorpay order.
// Never trust a total sent from the frontend.
const createRazorpayOrderForCart = asyncHandler(async (req, res) => {
  const shippingAddress = addressSchema.parse(req.body.shippingAddress);

  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.product",
    populate: { path: "category" },
  });
  if (!cart || cart.items.length === 0) throw new ApiError(400, "Cart is empty");

  let subtotal = 0;
  let gstTotal = 0;
  for (const item of cart.items) {
    if (!item.product || !item.product.isActive) {
      throw new ApiError(400, `Product ${item.product?.title || ""} is no longer available`);
    }
    if (item.product.stock < item.quantity) {
      throw new ApiError(400, `Insufficient stock for ${item.product.title}`);
    }
    const lineTotal = (item.sizePrice ?? item.product.price) * item.quantity;
    const gstPercent = item.product.category?.gstPercent || 0;
    subtotal += lineTotal;
    gstTotal += Math.round((lineTotal * gstPercent) / 100);
  }

  const totalAmount = subtotal + gstTotal + SHIPPING_FEE;
  const receipt = `rcpt_${req.user._id}_${Date.now()}`;
  const razorpayOrder = await createRazorpayOrder(totalAmount, receipt);

  res.json({
    success: true,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    shippingAddress, // echoed back so frontend can resubmit it in verify-payment
  });
});

// STEP 2: Frontend calls this after Razorpay Checkout success callback.
const verifyPaymentAndCreateOrder = asyncHandler(async (req, res) => {
  const schema = z.object({
    razorpayOrderId: z.string(),
    razorpayPaymentId: z.string(),
    razorpaySignature: z.string(),
    shippingAddress: addressSchema,
  });
  const data = schema.parse(req.body);

  const valid = verifyPaymentSignature(data);
  if (!valid) throw new ApiError(400, "Payment verification failed");

  const { cart, orderItems, subtotal, gstTotal } = await loadCartForOrder(req.user._id);
  const orderNumber = await generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    user: req.user._id,
    items: orderItems,
    shippingAddress: data.shippingAddress,
    subtotal,
    gstTotal,
    shippingFee: SHIPPING_FEE,
    discount: 0,
    totalAmount: subtotal + gstTotal + SHIPPING_FEE,
    paymentInfo: {
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
      razorpaySignature: data.razorpaySignature,
      method: "razorpay",
      status: "paid",
    },
    orderStatus: "placed",
    statusHistory: [{ status: "placed" }],
    placedAt: new Date(),
  });

  await finalizeCartAfterOrder(cart);

  // Order is already successfully created and paid at this point - a failed
  // confirmation email shouldn't fail the whole request and confuse the customer
  // into thinking their payment/order didn't go through.
  try {
    await sendOrderStatusEmail(req.user.email, order);
  } catch (err) {
    console.error(`Failed to send order confirmation email for ${order.orderNumber}:`, err.message);
  }

  res.status(201).json({ success: true, order });
});

// Cash on Delivery: no payment gateway involved - order is placed immediately
// and marked "pending" until cash is collected on delivery.
const createCodOrder = asyncHandler(async (req, res) => {
  const shippingAddress = addressSchema.parse(req.body.shippingAddress);

  const { cart, orderItems, subtotal, gstTotal } = await loadCartForOrder(req.user._id);
  const orderNumber = await generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    subtotal,
    gstTotal,
    shippingFee: SHIPPING_FEE,
    discount: 0,
    totalAmount: subtotal + gstTotal + SHIPPING_FEE,
    paymentInfo: {
      method: "cod",
      status: "pending",
    },
    orderStatus: "placed",
    statusHistory: [{ status: "placed" }],
    placedAt: new Date(),
  });

  await finalizeCartAfterOrder(cart);

  // Order is already successfully placed at this point - a failed confirmation
  // email shouldn't fail the whole request and confuse the customer.
  try {
    await sendOrderStatusEmail(req.user.email, order);
  } catch (err) {
    console.error(`Failed to send order confirmation email for ${order.orderNumber}:`, err.message);
  }

  res.status(201).json({ success: true, order });
});

// Razorpay webhook - safety net independent of the frontend callback.
// Must be mounted with raw body parsing (see routes file).
const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const isValid = verifyWebhookSignature(req.body, signature);
  if (!isValid) return res.status(400).json({ success: false, message: "Invalid signature" });

  const event = JSON.parse(req.body.toString());

  if (event.event === "payment.failed") {
    const paymentEntity = event.payload.payment.entity;
    await Order.findOneAndUpdate(
      { "paymentInfo.razorpayOrderId": paymentEntity.order_id },
      { "paymentInfo.status": "failed" }
    );
  }
  // "payment.captured" is already handled by verify-payment for the happy path;
  // this webhook exists mainly to catch failures/edge cases asynchronously.

  res.json({ received: true });
});

// ---------- CUSTOMER ----------
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ placedAt: -1 });
  res.json({ success: true, orders });
});

const getMyOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, "Order not found");
  res.json({ success: true, order });
});

// ---------- ADMIN ----------
const adminListOrders = asyncHandler(async (req, res) => {
  const { from, to, status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.orderStatus = status;
  if (from || to) {
    filter.placedAt = {};
    if (from) filter.placedAt.$gte = new Date(from);
    if (to) filter.placedAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Number(limit));

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email")
      .sort({ placedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, orders, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

const adminGetOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email phone");
  if (!order) throw new ApiError(404, "Order not found");
  res.json({ success: true, order });
});

const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["placed", "confirmed", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) throw new ApiError(400, "Invalid status");

  const order = await Order.findById(req.params.id).populate("user", "email");
  if (!order) throw new ApiError(404, "Order not found");

  order.orderStatus = status;
  order.statusHistory.push({ status });
  await order.save();

  // Same reasoning as above - the status update itself already succeeded in the DB,
  // so a failed email shouldn't make the admin think the status update failed.
  if (order.user?.email) {
    try {
      await sendOrderStatusEmail(order.user.email, order);
    } catch (err) {
      console.error(`Failed to send status update email for ${order.orderNumber}:`, err.message);
    }
  }

  res.json({ success: true, order });
});

module.exports = {
  createRazorpayOrderForCart,
  verifyPaymentAndCreateOrder,
  createCodOrder,
  razorpayWebhook,
  getMyOrders,
  getMyOrderById,
  adminListOrders,
  adminGetOrderById,
  adminUpdateOrderStatus,
};
