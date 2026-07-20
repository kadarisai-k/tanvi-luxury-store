import api from "./client";

// ---------- Auth ----------
export const adminLogin = (email, password) =>
  api.post("/auth/admin-login", { email, password }).then((r) => r.data);

// ---------- Dashboard ----------
export const getDashboardStats = () =>
  api.get("/admin/dashboard/stats").then((r) => r.data.stats);

// ---------- Settings ----------
export const getSettings = () => api.get("/settings").then((r) => r.data.settings);

export const updateSettings = (payload) =>
  api.put("/settings", payload).then((r) => r.data.settings);

// ---------- Home Page Edits (Featured / Best Sellers manual picks) ----------
export const getHomeSectionSettings = () =>
  api.get("/settings/home-sections").then((r) => r.data);

export const updateHomeSectionSettings = (payload) =>
  api.put("/settings/home-sections", payload).then((r) => r.data);

// ---------- Categories ----------
export const getCategories = () => api.get("/categories").then((r) => r.data.categories);

export const updateCategoryBanner = (id, formData) =>
  api
    .put(`/categories/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data.category);

// ---------- Category GST rates ----------
export const getCategoryGstRates = () =>
  api.get("/categories/admin/gst").then((r) => r.data.categories);

export const updateCategoryGst = (id, gstPercent) =>
  api.put(`/categories/${id}/gst`, { gstPercent }).then((r) => r.data.category);

// ---------- Products ----------
export const getAdminProducts = (params) =>
  api.get("/admin/products", { params }).then((r) => r.data);

export const createProduct = (formData) =>
  api
    .post("/admin/products", formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data.product);

export const updateProduct = (id, formData) =>
  api
    .put(`/admin/products/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data.product);

export const deleteProduct = (id) => api.delete(`/admin/products/${id}`).then((r) => r.data);

// ---------- Orders ----------
export const getAdminOrders = (params) =>
  api.get("/admin/orders", { params }).then((r) => r.data);

export const getAdminOrderById = (id) =>
  api.get(`/admin/orders/${id}`).then((r) => r.data.order);

export const updateOrderStatus = (id, status) =>
  api.put(`/admin/orders/${id}/status`, { status }).then((r) => r.data.order);

// ---------- Orders: file downloads ----------
// Downloaded as blobs (not plain <a href>) so the Bearer token is reliably attached,
// regardless of cross-origin cookie behavior between the admin panel and API domains.
async function downloadBlob(url, params, filename) {
  const res = await api.get(url, { params, responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export const downloadOrdersExport = (params, format) => {
  const dateSuffix = new Date().toISOString().slice(0, 10);
  return downloadBlob("/admin/orders/export", { ...params, format }, `orders_${dateSuffix}.${format}`);
};

export const downloadInvoice = (order) =>
  downloadBlob(`/admin/orders/${order._id}/invoice`, {}, `invoice-${order.orderNumber}.pdf`);
