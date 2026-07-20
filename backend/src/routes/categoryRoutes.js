const express = require("express");
const {
  getCategories,
  updateCategory,
  getCategoryGstRates,
  updateCategoryGst,
} = require("../controllers/categoryController");
const { requireAdminAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", getCategories);
router.get("/admin/gst", requireAdminAuth, getCategoryGstRates);
router.put("/:id/gst", requireAdminAuth, updateCategoryGst);
router.put("/:id", requireAdminAuth, upload.single("banner"), updateCategory);

module.exports = router;
