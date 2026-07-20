const Order = require("../models/Order");
const Product = require("../models/Product");
const { asyncHandler } = require("../utils/apiError");

const getDashboardStats = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [todayOrdersCount, monthOrders, lowStockProducts, totalActiveProducts, recentOrders] =
    await Promise.all([
      Order.countDocuments({ placedAt: { $gte: startOfToday } }),
      Order.find({ placedAt: { $gte: startOfMonth }, "paymentInfo.status": "paid" }),
      Product.find({ isActive: true, stock: { $lte: 5 } })
        .populate("category", "name slug")
        .sort({ stock: 1 })
        .limit(10),
      Product.countDocuments({ isActive: true }),
      Order.find().populate("user", "name email").sort({ placedAt: -1 }).limit(5),
    ]);

  const monthRevenue = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Orders by category this month (based on item category snapshots)
  const categoryTotals = {};
  monthOrders.forEach((order) => {
    order.items.forEach((item) => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.quantity;
    });
  });

  res.json({
    success: true,
    stats: {
      todayOrdersCount,
      monthOrdersCount: monthOrders.length,
      monthRevenue,
      totalActiveProducts,
      lowStockProducts,
      recentOrders,
      categoryTotals,
    },
  });
});

module.exports = { getDashboardStats };
