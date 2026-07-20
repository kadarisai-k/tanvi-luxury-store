const Order = require("../models/Order");
const { asyncHandler, ApiError } = require("../utils/apiError");
const { exportOrdersToExcel, exportOrdersToPdf, generateInvoicePdf } = require("../services/exportService");

// GET /api/admin/orders/export?from=&to=&status=&format=xlsx|pdf
const exportOrders = asyncHandler(async (req, res) => {
  const { from, to, status, format = "xlsx" } = req.query;
  const filter = {};
  if (status) filter.orderStatus = status;
  if (from || to) {
    filter.placedAt = {};
    if (from) filter.placedAt.$gte = new Date(from);
    if (to) filter.placedAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }

  const orders = await Order.find(filter).populate("user", "name email").sort({ placedAt: -1 });

  const dateSuffix = new Date().toISOString().slice(0, 10);
  if (format === "pdf") {
    return exportOrdersToPdf(orders, res, `orders_${dateSuffix}.pdf`);
  }
  return exportOrdersToExcel(orders, res, `orders_${dateSuffix}.xlsx`);
});

// GET /api/admin/orders/:id/invoice
const exportInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) throw new ApiError(404, "Order not found");
  generateInvoicePdf(order, res);
});

module.exports = { exportOrders, exportInvoice };
