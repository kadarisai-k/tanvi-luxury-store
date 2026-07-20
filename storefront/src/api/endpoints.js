import api from "./client";

// ---------- Public ----------
export const getCategories = () => api.get("/categories").then((r) => r.data.categories);

export const getProducts = (params) => api.get("/products", { params }).then((r) => r.data);

// Powers the homepage's Featured Pieces + Best Sellers rails in one call.
// See backend productController#getHomeSections for the selection logic.
export const getHomeSections = (limit = 8) =>
  api.get("/products/home-sections", { params: { limit } }).then((r) => r.data);

// Lightweight live-search used by the navbar search box - matches as the
// person types, not just on submit.
export const suggestProducts = (q) =>
  api.get("/products/suggest", { params: { q } }).then((r) => r.data.products);

export const getProductBySlug = (slug) =>
  api.get(`/products/${slug}`).then((r) => r.data.product);

export const getSettings = () => api.get("/settings").then((r) => r.data.settings);

// ---------- Auth (OTP) ----------
export const sendOtp = (email) => api.post("/auth/send-otp", { email }).then((r) => r.data);

export const verifyOtp = (email, otp, name) =>
  api.post("/auth/verify-otp", { email, otp, name }).then((r) => r.data);

export const getMe = () => api.get("/auth/me").then((r) => r.data.user);

export const logoutCustomer = () => api.post("/auth/logout").then((r) => r.data);

// ---------- Cart (server-side, once logged in) ----------
export const getServerCart = () => api.get("/cart").then((r) => r.data.cart);

export const syncCart = (items) => api.post("/cart/sync", { items }).then((r) => r.data.cart);

// Nothing photo-related is collected here - that choice (Drive link vs
// WhatsApp) is made afterwards on the Cart page. See updateServerCartItem.
export const addToServerCart = (productId, quantity) =>
  api.post("/cart/add", { productId, quantity }).then((r) => r.data.cart);

// itemId is the cart line item's own _id (not the product id) - a product can
// appear as multiple lines once different photo-share choices are attached.
export const updateServerCartItem = (itemId, { quantity, driveLink, photoShareMethod } = {}) =>
  api.put("/cart/update", { itemId, quantity, driveLink, photoShareMethod }).then((r) => r.data.cart);

export const removeFromServerCart = (itemId) =>
  api.delete(`/cart/remove/${itemId}`).then((r) => r.data.cart);

// ---------- Orders / Checkout ----------
export const createRazorpayOrder = (shippingAddress) =>
  api.post("/orders/create-razorpay-order", { shippingAddress }).then((r) => r.data);

export const verifyPayment = (payload) =>
  api.post("/orders/verify-payment", payload).then((r) => r.data.order);

export const createCodOrder = (shippingAddress) =>
  api.post("/orders/cod", { shippingAddress }).then((r) => r.data.order);

export const getMyOrders = () => api.get("/orders/my-orders").then((r) => r.data.orders);

export const getMyOrderById = (id) =>
  api.get(`/orders/my-orders/${id}`).then((r) => r.data.order);
