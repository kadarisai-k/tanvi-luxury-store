const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { asyncHandler, ApiError } = require("../utils/apiError");

// Cart is only persisted server-side once the user is logged in.
// Guests keep their cart in localStorage on the frontend and it gets
// synced here right after OTP verification (see syncCart below).

// Deliberately loose: just needs to look like a Drive/Photos share link. We
// don't want to reject a valid link over a minor formatting quirk, but we do
// want to catch someone pasting an unrelated URL (or plain text) by mistake.
function isLikelyDriveLink(link) {
  return /^https:\/\/(drive|photos)\.google\.com\//i.test(link.trim());
}

// Nothing is required at add-to-cart time - the customer picks how to share
// their photos (paste a Drive link, or send it via WhatsApp) afterwards, from
// the Cart page's "Add Photos" action (see updateCartItem below). This just
// validates whatever was actually submitted, so a malformed link never gets
// silently stored.
function resolvePhotoShare({ photoShareMethod, driveLink }) {
  const method = ["drive", "whatsapp", ""].includes(photoShareMethod) ? photoShareMethod : "";
  const trimmedLink = (driveLink || "").trim();

  if (method === "drive") {
    if (!trimmedLink) {
      throw new ApiError(400, "Please paste your Google Drive link.");
    }
    if (!isLikelyDriveLink(trimmedLink)) {
      throw new ApiError(
        400,
        "That doesn't look like a Google Drive link. Please share a link starting with https://drive.google.com or https://photos.google.com, with sharing set to \"Anyone with the link.\""
      );
    }
    return { photoShareMethod: "drive", driveLink: trimmedLink };
  }

  if (method === "whatsapp") {
    return { photoShareMethod: "whatsapp", driveLink: "" };
  }

  return { photoShareMethod: "", driveLink: "" };
}

const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate({ path: "items.product", populate: { path: "category" } });
  if (!cart) return res.json({ success: true, cart: { items: [] } });

  // A product may have been deleted (or deactivated) by the admin since it was
  // added to this cart. Drop dead references here so the frontend never has to
  // handle a null product, and persist the cleanup.
  const validItems = cart.items.filter((i) => i.product && i.product.isActive);
  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  res.json({ success: true, cart });
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, "Product not found");

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  // Photo sharing (Drive link / WhatsApp) is chosen later from the Cart page,
  // so a fresh add-to-bag always starts with no choice made. Two lines of the
  // same product only merge if neither has a photo-share choice attached yet -
  // once a choice is made on one line (see updateCartItem), adding the same
  // product again starts a fresh, separate line rather than silently
  // overwriting that choice.
  const existing = cart.items.find(
    (i) => i.product.toString() === productId && !i.photoShareMethod
  );
  if (existing) existing.quantity += Number(quantity);
  else cart.items.push({ product: productId, quantity: Number(quantity) });

  await cart.save();
  await cart.populate({ path: "items.product", populate: { path: "category" } });
  res.json({ success: true, cart });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId, quantity, photoShareMethod, driveLink: rawDriveLink } = req.body;
  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.product",
    populate: { path: "category" },
  });
  if (!cart) throw new ApiError(404, "Cart not found");

  const item = cart.items.id(itemId);
  if (!item) throw new ApiError(404, "Item not in cart");

  if (quantity !== undefined && Number(quantity) <= 0) {
    cart.items.pull({ _id: itemId });
  } else {
    if (quantity !== undefined) item.quantity = Number(quantity);
    if (photoShareMethod !== undefined || rawDriveLink !== undefined) {
      const resolved = resolvePhotoShare({
        photoShareMethod: photoShareMethod !== undefined ? photoShareMethod : item.photoShareMethod,
        driveLink: rawDriveLink !== undefined ? rawDriveLink : item.driveLink,
      });
      item.photoShareMethod = resolved.photoShareMethod;
      item.driveLink = resolved.driveLink;
    }
  }

  await cart.save();
  await cart.populate({ path: "items.product", populate: { path: "category" } });
  res.json({ success: true, cart });
});

const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, "Cart not found");
  cart.items.pull({ _id: req.params.itemId });
  await cart.save();
  await cart.populate({ path: "items.product", populate: { path: "category" } });
  res.json({ success: true, cart });
});

// Merge a guest's localStorage cart into the DB right after login.
const syncCart = asyncHandler(async (req, res) => {
  const { items } = req.body; // [{ productId, quantity, driveLink, photoShareMethod }]
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  for (const { productId, quantity, driveLink: rawDriveLink, photoShareMethod: rawMethod } of items || []) {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) continue; // silently skip - product may have gone since

    let resolved = { photoShareMethod: "", driveLink: "" };
    try {
      resolved = resolvePhotoShare({ photoShareMethod: rawMethod, driveLink: rawDriveLink });
    } catch {
      // A guest-cart item with a malformed Drive link shouldn't block login -
      // just drop that item's photo-share choice and keep the product/qty.
    }

    const existing = cart.items.find(
      (i) =>
        i.product.toString() === productId &&
        (i.photoShareMethod || "") === resolved.photoShareMethod &&
        (i.driveLink || "") === resolved.driveLink
    );
    if (existing) existing.quantity += quantity;
    else cart.items.push({ product: productId, quantity, ...resolved });
  }

  await cart.save();
  await cart.populate({ path: "items.product", populate: { path: "category" } });
  res.json({ success: true, cart });
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, syncCart };
