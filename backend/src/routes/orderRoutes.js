const express = require("express");
const {
  createRazorpayOrderForCart,
  verifyPaymentAndCreateOrder,
  createCodOrder,
  getMyOrders,
  getMyOrderById,
} = require("../controllers/orderController");
const { requireCustomerAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireCustomerAuth);

router.post("/create-razorpay-order", createRazorpayOrderForCart);
router.post("/verify-payment", verifyPaymentAndCreateOrder);
router.post("/cod", createCodOrder);
router.get("/my-orders", getMyOrders);
router.get("/my-orders/:id", getMyOrderById);

module.exports = router;
