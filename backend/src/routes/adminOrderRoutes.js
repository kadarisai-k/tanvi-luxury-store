const express = require("express");
const {
  adminListOrders,
  adminGetOrderById,
  adminUpdateOrderStatus,
} = require("../controllers/orderController");
const { exportOrders, exportInvoice } = require("../controllers/exportController");
const { requireAdminAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAdminAuth);

router.get("/export", exportOrders); // must be before /:id to avoid route clash
router.get("/", adminListOrders);
router.get("/:id", adminGetOrderById);
router.get("/:id/invoice", exportInvoice);
router.put("/:id/status", adminUpdateOrderStatus);

module.exports = router;
