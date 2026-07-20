const Category = require("../models/Category");
const { asyncHandler, ApiError } = require("../utils/apiError");
const { uploadBuffer, deleteImage } = require("../services/cloudinaryService");

// Public: list the 4 categories
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, categories });
});

// Admin: update a category's banner image / description
// (Categories themselves are fixed - only 4 - seeded once, never created/deleted via API)
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");

  if (req.body.description !== undefined) category.description = req.body.description;

  if (req.file) {
    if (category.bannerImage?.publicId) await deleteImage(category.bannerImage.publicId);
    const uploaded = await uploadBuffer(req.file.buffer, "tanvi-store/categories");
    category.bannerImage = uploaded;
  }

  await category.save();
  res.json({ success: true, category });
});

// Admin: GST section - list all categories with their GST rate (same as public
// list, but kept separate so the intent is clear on the admin side).
const getCategoryGstRates = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 }).select("name slug gstPercent");
  res.json({ success: true, categories });
});

// Admin: update just the GST percentage for one category.
const updateCategoryGst = asyncHandler(async (req, res) => {
  const gstPercent = Number(req.body.gstPercent);
  if (Number.isNaN(gstPercent) || gstPercent < 0 || gstPercent > 100) {
    throw new ApiError(400, "GST percent must be a number between 0 and 100");
  }

  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");

  category.gstPercent = gstPercent;
  await category.save();

  res.json({ success: true, category });
});

module.exports = { getCategories, updateCategory, getCategoryGstRates, updateCategoryGst };
