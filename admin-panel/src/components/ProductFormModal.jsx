import { useState, useEffect } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import { createProduct, updateProduct } from "../api/endpoints";

const emptyForm = {
  title: "",
  description: "",
  price: "",
  mrp: "",
  stock: "",
  sku: "",
  material: "",
  dimensions: "",
  weight: "",
  color: "",
  capacity: "",
  isFeatured: false,
};

const MAX_SIZE_VARIANTS = 8;
const emptySizeVariant = { label: "", price: "" };

export default function ProductFormModal({ categorySlug, product, onClose, onSaved }) {
  const isEdit = !!product;
  const showSizeVariants = categorySlug === "photo_frames" || categorySlug === "photo_albums";
  const [form, setForm] = useState(emptyForm);
  const [sizeVariants, setSizeVariants] = useState([]);
  const [newImages, setNewImages] = useState([]); // File objects
  const [newPreviews, setNewPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // {url, publicId}
  const [removeIds, setRemoveIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (product) {
      setForm({
        title: product.title || "",
        description: product.description || "",
        price: product.price ?? "",
        mrp: product.mrp ?? "",
        stock: product.stock ?? "",
        sku: product.sku || "",
        material: product.attributes?.material || "",
        dimensions: product.attributes?.dimensions || "",
        weight: product.attributes?.weight || "",
        color: product.attributes?.color || "",
        capacity: product.attributes?.capacity || "",
        isFeatured: product.isFeatured || false,
      });
      setExistingImages(product.images || []);
      setSizeVariants(
        (product.sizeVariants || []).map((v) => ({ label: v.label, price: String(v.price) }))
      );
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const totalCount = existingImages.length - removeIds.length + newImages.length + files.length;
    if (totalCount > 6) {
      setError("Maximum 6 images per product.");
      return;
    }
    setError("");
    setNewImages((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeNewImage = (idx) => {
    setNewImages((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleRemoveExisting = (publicId) => {
    setRemoveIds((prev) =>
      prev.includes(publicId) ? prev.filter((id) => id !== publicId) : [...prev, publicId]
    );
  };

  const addSizeVariant = () => {
    setSizeVariants((prev) =>
      prev.length >= MAX_SIZE_VARIANTS ? prev : [...prev, { ...emptySizeVariant }]
    );
  };

  const updateSizeVariant = (idx, field, value) => {
    setSizeVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
  };

  const removeSizeVariant = (idx) => {
    setSizeVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const remainingExisting = existingImages.length - removeIds.length;
    if (remainingExisting + newImages.length === 0) {
      setError("Add at least one product image.");
      return;
    }

    // Only rows the admin actually filled in count - a blank row left over
    // from clicking "+ Add size" is just dropped rather than blocking save.
    const cleanedSizeVariants = sizeVariants
      .map((v) => ({ label: v.label.trim(), price: v.price }))
      .filter((v) => v.label || v.price);

    if (showSizeVariants) {
      for (const v of cleanedSizeVariants) {
        if (!v.label || !v.price || Number(v.price) <= 0) {
          setError("Each size needs both a label and a price greater than 0.");
          return;
        }
      }
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("price", form.price);
      if (form.mrp) fd.append("mrp", form.mrp);
      fd.append("stock", form.stock);
      fd.append("sku", form.sku);
      fd.append("material", form.material);
      fd.append("dimensions", form.dimensions);
      fd.append("weight", form.weight);
      fd.append("color", form.color);
      fd.append("capacity", form.capacity);
      fd.append("isFeatured", form.isFeatured);
      if (showSizeVariants) {
        fd.append(
          "sizeVariants",
          JSON.stringify(cleanedSizeVariants.map((v) => ({ label: v.label, price: Number(v.price) })))
        );
      }
      newImages.forEach((file) => fd.append("images", file));

      if (isEdit) {
        if (removeIds.length) fd.append("removeImageIds", JSON.stringify(removeIds));
        await updateProduct(product._id, fd);
      } else {
        fd.append("categorySlug", categorySlug);
        await createProduct(fd);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink-950/40 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl2 shadow-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-line px-6 py-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-950">
            {isEdit ? "Edit product" : "Add product"}
          </h2>
          <button onClick={onClose} className="text-ink-950/50 hover:text-ink-950">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <Field label="Title" name="title" value={form.title} onChange={handleChange} required />
          <div>
            <label className="text-sm font-medium text-ink-950/80">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-plum-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field
              label={showSizeVariants ? "Default price (₹)" : "Price (₹)"}
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              required
            />
            <Field label="MRP (₹)" name="mrp" type="number" value={form.mrp} onChange={handleChange} />
            <Field
              label="Stock"
              name="stock"
              type="number"
              value={form.stock}
              onChange={handleChange}
              placeholder={isEdit ? "" : "Leave blank for full stock"}
            />
          </div>

          {showSizeVariants && (
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-ink-950/80">
                  Sizes &amp; prices (up to {MAX_SIZE_VARIANTS})
                </label>
                {sizeVariants.length < MAX_SIZE_VARIANTS && (
                  <button
                    type="button"
                    onClick={addSizeVariant}
                    className="text-xs font-medium text-plum-700 hover:text-plum-800"
                  >
                    + Add size
                  </button>
                )}
              </div>
              <p className="text-xs text-ink-950/40 mt-1 mb-2">
                Customers pick one of these on the product page and the price updates to match. Leave
                empty if this product doesn't come in multiple sizes - the "Default price" above will
                be used instead.
              </p>
              {sizeVariants.length > 0 && (
                <div className="flex flex-col gap-2">
                  {sizeVariants.map((v, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        value={v.label}
                        onChange={(e) => updateSizeVariant(idx, "label", e.target.value)}
                        placeholder={`e.g. A5 (9.5 x 6) Small Horizontal`}
                        className="flex-1 rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-plum-600 outline-none"
                      />
                      <input
                        type="number"
                        value={v.price}
                        onChange={(e) => updateSizeVariant(idx, "price", e.target.value)}
                        placeholder="Price (₹)"
                        className="w-32 rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-plum-600 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeSizeVariant(idx)}
                        className="text-ink-950/40 hover:text-danger p-1"
                        title="Remove size"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Field label="SKU" name="sku" value={form.sku} onChange={handleChange} />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Material" name="material" value={form.material} onChange={handleChange} />
            <Field label="Color" name="color" value={form.color} onChange={handleChange} />
            <Field label="Dimensions" name="dimensions" value={form.dimensions} onChange={handleChange} />
            <Field label="Weight" name="weight" value={form.weight} onChange={handleChange} />
          </div>
          <Field label="Capacity / Pages (for albums, etc.)" name="capacity" value={form.capacity} onChange={handleChange} />

          <p className="text-xs text-ink-950/40 -mb-1">
            To feature this product on the home page, use the "Home Page Edits" section in the
            sidebar instead of a per-product toggle.
          </p>

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div>
              <label className="text-sm font-medium text-ink-950/80">Existing images</label>
              <div className="mt-2 flex flex-wrap gap-3">
                {existingImages.map((img) => {
                  const marked = removeIds.includes(img.publicId);
                  return (
                    <div key={img.publicId} className="relative">
                      <img
                        src={img.url}
                        className={`w-20 h-20 object-cover rounded-lg border ${
                          marked ? "opacity-30 border-danger" : "border-line"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleRemoveExisting(img.publicId)}
                        className={`absolute -top-2 -right-2 rounded-full p-1 ${
                          marked ? "bg-ink-950 text-white" : "bg-danger text-white"
                        }`}
                        title={marked ? "Undo remove" : "Remove image"}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New images */}
          <div>
            <label className="text-sm font-medium text-ink-950/80">
              {isEdit ? "Add more images" : "Product images"}
            </label>
            <div className="mt-2 flex flex-wrap gap-3">
              {newPreviews.map((src, idx) => (
                <div key={idx} className="relative">
                  <img src={src} className="w-20 h-20 object-cover rounded-lg border border-line" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute -top-2 -right-2 rounded-full p-1 bg-danger text-white"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-lg border-2 border-dashed border-line flex flex-col items-center justify-center gap-1 text-ink-950/40 hover:border-plum-400 hover:text-plum-600 cursor-pointer transition-colors">
                <Upload size={16} />
                <span className="text-[10px]">Upload</span>
                <input type="file" accept="image/*" multiple hidden onChange={handleFileSelect} />
              </label>
            </div>
            <p className="text-xs text-ink-950/40 mt-1.5">Up to 6 images, 5MB each.</p>
          </div>

          {error && <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-line rounded-lg py-2.5 text-sm font-medium text-ink-950/70 hover:bg-canvas transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-plum-700 hover:bg-plum-800 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="text-sm font-medium text-ink-950/80">{label}</label>
      <input
        {...props}
        className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-plum-600 outline-none"
      />
    </div>
  );
}
