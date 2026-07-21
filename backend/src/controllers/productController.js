const { z } = require("zod");
const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const Setting = require("../models/Setting");
const { asyncHandler, ApiError } = require("../utils/apiError");
const { uploadMultiple, deleteImage } = require("../services/cloudinaryService");

// The four storefront sections that products are grouped into. Kept in sync
// with the Category slug enum.
const SECTION_SLUGS = ["kitchen", "jewellery", "photo_frames", "photo_albums"];
const PER_SECTION_PICKS = 2; // how many random products to pull from each section as a fallback

// Picks `count` random products (active catalog) from a given category,
// excluding any ids already used elsewhere on the page. Uses $sample so the
// pick is genuinely random and cheap even on larger catalogs.
const randomProductsForCategory = async (categoryId, count, excludeIds = []) => {
  return Product.aggregate([
    {
      $match: {
        category: categoryId,
        isActive: true,
        ...(excludeIds.length ? { _id: { $nin: excludeIds } } : {}),
      },
    },
    { $sample: { size: count } },
  ]);
};

// Falls back to `PER_SECTION_PICKS` random products per section (category)
// when there isn't enough real data (no featured picks / no sales yet).
// `excludeIds` lets the best-seller fallback avoid repeating whatever was
// already shown in the featured section.
const randomPicksAcrossSections = async (excludeIds = []) => {
  const categories = await Category.find({ slug: { $in: SECTION_SLUGS }, isActive: true });
  const picksPerCategory = await Promise.all(
    categories.map((cat) => randomProductsForCategory(cat._id, PER_SECTION_PICKS, excludeIds))
  );
  const products = picksPerCategory.flat();
  return Product.populate(products, { path: "category", select: "name slug gstPercent" });
};

// ---------- PUBLIC ----------

// GET /api/products?category=kitchen&sort=price_asc|price_desc|newest&page=1&limit=12&search=
const listProducts = asyncHandler(async (req, res) => {
  const { category, sort, page = 1, limit = 12, search, minPrice, maxPrice, featured } = req.query;

  const filter = { isActive: true };

  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (!cat) return res.json({ success: true, products: [], total: 0, page: 1, pages: 0 });
    filter.category = cat._id;
  }
  if (search) filter.$text = { $search: search };
  if (featured === "true") filter.isFeatured = true;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    newest: { createdAt: -1 },
  };
  const sortBy = sortMap[sort] || { createdAt: -1 };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Number(limit));

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug gstPercent")
      .sort(sortBy)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    products,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
  });
});

// GET /api/products/suggest?q=... - lightweight, fast lookup used by the navbar
// search box while the person is still typing. Matches anywhere in the title
// (not just whole words, unlike the $text search used by /products?search=),
// so partial/prefix input like "silv" already shows "Silver Anklet".
const suggestProducts = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ success: true, products: [] });

  const products = await Product.find({
    isActive: true,
    title: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
  })
    .populate("category", "name slug gstPercent")
    .select("title slug price mrp images category")
    .limit(8);

  res.json({ success: true, products });
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate(
    "category",
    "name slug"
  );
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ success: true, product });
});

// Turns a Setting.*ProductIds array into actual (active) Product docs, in the
// same order the admin arranged them in on the Home Page Edits screen. If a
// picked product was since deactivated/deleted it's silently dropped rather
// than showing a gap or an error.
const resolveManualPicks = async (ids) => {
  if (!ids || ids.length === 0) return [];
  const products = await Product.find({ _id: { $in: ids }, isActive: true }).populate(
    "category",
    "name slug gstPercent"
  );
  const byId = new Map(products.map((p) => [String(p._id), p]));
  return ids.map((id) => byId.get(String(id))).filter(Boolean);
};

// GET /api/products/home-sections
// Powers the two homepage rails:
//
// - featured: whatever the admin has hand-picked (isFeatured: true). If the
//   admin hasn't picked anything, we fall back to 2 random products per
//   section (category) so the homepage never looks empty.
// - bestSellers: products ranked by units actually sold (from delivered/paid
//   order history), highest first. If nothing has sold yet, we fall back to
//   2 random products per section too - but we make sure those don't repeat
//   whatever ended up in the featured rail, so the two rails always show
//   different products.
const getHomeSections = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Number(req.query.limit) || 8);
  const settings = await Setting.findOne({ key: "site" });

  // ---- Featured ----
  // 1. Admin's manual pick from the Home Page Edits screen, if any.
  let featured = await resolveManualPicks(settings?.featuredProductIds);
  let featuredIsFallback = false;

  // 2. Nothing picked - fall back to 2 random products per section so the
  //    homepage never looks empty.
  if (featured.length === 0) {
    featured = await randomPicksAcrossSections();
    featuredIsFallback = true;
  }
  featured = featured.slice(0, limit);

  // ---- Best sellers ----
  // 1. Admin's manual pick from the Home Page Edits screen, if any.
  let bestSellers = await resolveManualPicks(settings?.bestSellerProductIds);
  let bestSellersIsFallback = false;

  // 2. Nothing picked - rank by units actually sold (paid/COD orders that
  //    weren't cancelled, so a handful of failed orders don't skew things).
  if (bestSellers.length === 0) {
    const salesAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          unitsSold: { $sum: "$items.quantity" },
        },
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { unitsSold: -1 } },
      { $limit: limit },
    ]);

    if (salesAgg.length > 0) {
      const ids = salesAgg.map((row) => row._id);
      const products = await Product.find({ _id: { $in: ids }, isActive: true }).populate(
        "category",
        "name slug gstPercent"
      );
      // Re-order the fetched products to match descending units-sold order,
      // since $in lookups don't preserve the aggregation's sort order.
      const byId = new Map(products.map((p) => [String(p._id), p]));
      bestSellers = salesAgg.map((row) => byId.get(String(row._id))).filter(Boolean);
    }

    // 3. Nothing sold yet either - pick randomly, avoiding duplicates with
    //    whatever the featured rail is already showing.
    if (bestSellers.length === 0) {
      bestSellers = await randomPicksAcrossSections(featured.map((p) => p._id));
      bestSellersIsFallback = true;
    }
  }
  bestSellers = bestSellers.slice(0, limit);

  res.json({
    success: true,
    featured,
    featuredIsFallback,
    bestSellers,
    bestSellersIsFallback,
  });
});

// ---------- ADMIN ----------

// New products default to "in stock" unless the admin explicitly types a
// number (including 0) in the Stock field — an accidentally-blank field
// shouldn't silently make a brand-new product show as out of stock.
const DEFAULT_STOCK = 999;

const sizeVariantSchema = z.object({
  label: z.string().min(1),
  price: z.coerce.number().positive(),
});

// Sent from the admin form as a JSON string (FormData can't carry nested
// arrays directly, same reason removeImageIds is a JSON string below).
// Blank/undefined -> no size variants, which is the normal case for
// Kitchen/Jewellery products.
const parseSizeVariants = (raw) => {
  if (raw === undefined || raw === null || raw === "") return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ApiError(400, "Invalid size variants.");
  }
  if (!Array.isArray(parsed) || parsed.length > 8) {
    throw new ApiError(400, "A product can have at most 8 size variants.");
  }
  return parsed.map((v) => sizeVariantSchema.parse(v));
};

const productSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().default(""),
  categorySlug: z.enum(["kitchen", "jewellery", "photo_frames", "photo_albums"]),
  price: z.coerce.number().positive(),
  mrp: z.coerce.number().optional(),
  stock: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : v),
    z.coerce.number().int().nonnegative().optional()
  ),
  sku: z.string().optional(),
  material: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
  color: z.string().optional(),
  capacity: z.string().optional(),
  isFeatured: z.coerce.boolean().optional().default(false),
});

const createProduct = asyncHandler(async (req, res) => {
  const data = productSchema.parse(req.body);
  const sizeVariants = parseSizeVariants(req.body.sizeVariants);
  const category = await Category.findOne({ slug: data.categorySlug });
  if (!category) throw new ApiError(400, "Invalid category");

  let images = [];
  if (req.files && req.files.length) {
    images = await uploadMultiple(req.files, "tanvi-store/products");
  }

  let slug = slugify(data.title);
  const existing = await Product.findOne({ slug });
  if (existing) slug = `${slug}-${Date.now().toString().slice(-5)}`;

  const product = await Product.create({
    title: data.title,
    slug,
    category: category._id,
    description: data.description,
    images,
    price: data.price,
    mrp: data.mrp,
    sizeVariants,
    stock: data.stock ?? DEFAULT_STOCK,
    sku: data.sku,
    isFeatured: data.isFeatured,
    attributes: {
      material: data.material,
      dimensions: data.dimensions,
      weight: data.weight,
      color: data.color,
      capacity: data.capacity,
    },
  });

  res.status(201).json({ success: true, product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");

  const allowedFields = [
    "title",
    "description",
    "price",
    "mrp",
    "stock",
    "sku",
    "isFeatured",
    "isActive",
  ];
  allowedFields.forEach((field) => {
    if (field === "stock") {
      if (req.body.stock !== undefined && req.body.stock !== "") product.stock = req.body.stock;
      return;
    }
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  ["material", "dimensions", "weight", "color", "capacity"].forEach((attr) => {
    if (req.body[attr] !== undefined) product.attributes[attr] = req.body[attr];
  });

  if (req.body.sizeVariants !== undefined) {
    product.sizeVariants = parseSizeVariants(req.body.sizeVariants);
  }

  if (req.body.categorySlug) {
    const category = await Category.findOne({ slug: req.body.categorySlug });
    if (!category) throw new ApiError(400, "Invalid category");
    product.category = category._id;
  }

  // New images to append
  if (req.files && req.files.length) {
    const uploaded = await uploadMultiple(req.files, "tanvi-store/products");
    product.images.push(...uploaded);
  }

  // Remove specific images by publicId (sent as JSON array string in body.removeImageIds)
  if (req.body.removeImageIds) {
    const idsToRemove = JSON.parse(req.body.removeImageIds);
    for (const publicId of idsToRemove) {
      await deleteImage(publicId);
    }
    product.images = product.images.filter((img) => !idsToRemove.includes(img.publicId));
  }

  await product.save();
  res.json({ success: true, product });
});

// Hard delete: removes images from Cloudinary AND the document from MongoDB,
// so both storage quotas actually free up for a rotating 100-150 product catalog.
// This is safe because Order.items already stores a snapshot (title/image/price/
// category) at the time of purchase - it does NOT depend on the Product document
// existing, so past orders keep displaying correctly even after the product is gone.
//
// If you'd rather just hide a product temporarily without deleting it (e.g. "out of
// season, might bring it back"), use PUT /api/admin/products/:id with { isActive: false }
// instead of this endpoint - that keeps it in the DB/Cloudinary but hides it from the storefront.
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");

  // Free up Cloudinary storage
  for (const image of product.images) {
    await deleteImage(image.publicId);
  }

  await Product.deleteOne({ _id: product._id });

  res.json({ success: true, message: "Product permanently deleted" });
});

// Admin listing includes inactive products too, with pagination
const adminListProducts = asyncHandler(async (req, res) => {
  const { category, page = 1, limit = 20, search } = req.query;
  const filter = {};
  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (cat) filter.category = cat._id;
  }
  if (search) filter.title = { $regex: search, $options: "i" };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(500, Number(limit));

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug gstPercent")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, products, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

module.exports = {
  listProducts,
  suggestProducts,
  getProductBySlug,
  getHomeSections,
  createProduct,
  updateProduct,
  deleteProduct,
  adminListProducts,
};
