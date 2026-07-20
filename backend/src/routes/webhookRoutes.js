const express = require("express");
const { razorpayWebhook } = require("../controllers/orderController");

const router = express.Router();

// NOTE: this route must be mounted in app.js BEFORE the global express.json()
// parser (or with express.raw() applied here) because Razorpay signature
// verification requires the exact raw request body bytes.
router.post("/razorpay", express.raw({ type: "application/json" }), razorpayWebhook);

module.exports = router;
