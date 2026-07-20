const express = require("express");
const { getDashboardStats } = require("../controllers/dashboardController");
const { requireAdminAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/stats", requireAdminAuth, getDashboardStats);

module.exports = router;
