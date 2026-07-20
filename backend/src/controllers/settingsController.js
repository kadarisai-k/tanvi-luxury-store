const { z } = require("zod");
const mongoose = require("mongoose");
const Setting = require("../models/Setting");
const { MAX_HOME_SECTION_PICKS } = Setting;
const { asyncHandler, ApiError } = require("../utils/apiError");

// There's always exactly one settings document (key: "site"). Create it on first read
// so the app works even before an admin has ever saved anything.
async function getOrCreateSiteSettings() {
  let settings = await Setting.findOne({ key: "site" });
  if (!settings) settings = await Setting.create({ key: "site" });
  return settings;
}

// GET /api/settings - public, used by the storefront (e.g. announcement bar).
const getSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSiteSettings();
  res.json({
    success: true,
    settings: { announcementText: settings.announcementText || "" },
  });
});

// PUT /api/settings - admin only. Kept for the general Settings page
// (announcement bar text). Home page product picks are saved separately via
// PUT /api/settings/home-sections below, so each screen only ever sends the
// fields it actually owns.
const updateSettings = asyncHandler(async (req, res) => {
  const schema = z.object({ announcementText: z.string().max(300).optional().default("") });
  const { announcementText } = schema.parse(req.body);

  const settings = await getOrCreateSiteSettings();
  settings.announcementText = announcementText;
  await settings.save();

  res.json({ success: true, settings: { announcementText: settings.announcementText } });
});

// GET /api/settings/home-sections - admin only. Powers the Home Page Edits
// screen: returns the manually picked product ids (populated with just
// enough fields to render a "selected" state) for both rails.
const getHomeSectionSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSiteSettings();
  await settings.populate([
    { path: "featuredProductIds", select: "title slug price images category isActive" },
    { path: "bestSellerProductIds", select: "title slug price images category isActive" },
  ]);

  res.json({
    success: true,
    featuredProducts: settings.featuredProductIds,
    bestSellerProducts: settings.bestSellerProductIds,
    maxPicks: MAX_HOME_SECTION_PICKS,
  });
});

const objectId = z.string().refine((v) => mongoose.isValidObjectId(v), "Invalid product id");

// PUT /api/settings/home-sections - admin only.
// Body: { featuredProductIds?: string[], bestSellerProductIds?: string[] }
// Either field can be omitted to leave that rail's selection untouched, or
// sent as [] to clear it back to the automatic fallback.
const updateHomeSectionSettings = asyncHandler(async (req, res) => {
  const schema = z.object({
    featuredProductIds: z.array(objectId).max(MAX_HOME_SECTION_PICKS).optional(),
    bestSellerProductIds: z.array(objectId).max(MAX_HOME_SECTION_PICKS).optional(),
  });
  const data = schema.parse(req.body);

  if (data.featuredProductIds === undefined && data.bestSellerProductIds === undefined) {
    throw new ApiError(400, "Nothing to update");
  }

  const settings = await getOrCreateSiteSettings();
  if (data.featuredProductIds !== undefined) settings.featuredProductIds = data.featuredProductIds;
  if (data.bestSellerProductIds !== undefined) settings.bestSellerProductIds = data.bestSellerProductIds;
  await settings.save();
  await settings.populate([
    { path: "featuredProductIds", select: "title slug price images category isActive" },
    { path: "bestSellerProductIds", select: "title slug price images category isActive" },
  ]);

  res.json({
    success: true,
    featuredProducts: settings.featuredProductIds,
    bestSellerProducts: settings.bestSellerProductIds,
  });
});

module.exports = {
  getSettings,
  updateSettings,
  getHomeSectionSettings,
  updateHomeSectionSettings,
};
