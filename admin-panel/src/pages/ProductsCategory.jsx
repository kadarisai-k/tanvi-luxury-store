import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import AppLayout from "../components/AppLayout";
import ProductFormModal from "../components/ProductFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { getAdminProducts, deleteProduct } from "../api/endpoints";

const CATEGORY_META = {
  kitchen: { label: "Kitchen" },
  jewellery: { label: "Jewellery" },
  photo_frames: { label: "Photo Frames" },
  photo_albums: { label: "Photo Albums" },
};

export default function ProductsCategory() {
  const { categorySlug } = useParams();
  const meta = CATEGORY_META[categorySlug] || { label: categorySlug };

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalProduct, setModalProduct] = useState(undefined); // undefined = closed, null = add, obj = edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getAdminProducts({ category: categorySlug, search: search || undefined, limit: 100 })
      .then((data) => {
        setProducts(data.products);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [categorySlug, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget._id);
      setDeleteTarget(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">{meta.label}</h1>
          <p className="text-sm text-ink-950/50 mt-0.5">{total} product{total !== 1 && "s"}</p>
        </div>
        <button
          onClick={() => setModalProduct(null)}
          className="flex items-center gap-2 bg-plum-700 hover:bg-plum-800 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
        >
          <Plus size={16} /> Add product
        </button>
      </div>

      <div className="relative mb-4 max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-950/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full rounded-lg border border-line pl-9 pr-3 py-2 text-sm focus:border-plum-600 outline-none bg-surface"
        />
      </div>

      <div className="bg-surface rounded-xl2 shadow-card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-950/40">
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Stock</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-ink-950/40">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink-950/40">
                  No products yet in {meta.label}. Click "Add product" to create your first one.
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p._id} className="hover:bg-canvas/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.images?.[0]?.url}
                      alt={p.title}
                      className="w-10 h-10 rounded-lg object-cover border border-line bg-canvas"
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-ink-950 truncate max-w-[220px]">{p.title}</div>
                      {p.sku && <div className="text-xs text-ink-950/40">SKU: {p.sku}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="font-medium text-ink-950">₹{p.price?.toLocaleString("en-IN")}</div>
                  {p.mrp > p.price && (
                    <div className="text-xs text-ink-950/40 line-through">
                      ₹{p.mrp?.toLocaleString("en-IN")}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={p.stock <= 5 ? "text-danger font-medium" : "text-ink-950"}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      p.isActive ? "bg-success/10 text-success" : "bg-ink-950/10 text-ink-950/50"
                    }`}
                  >
                    {p.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setModalProduct(p)}
                      className="p-2 rounded-lg text-ink-950/50 hover:bg-plum-50 hover:text-plum-700 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="p-2 rounded-lg text-ink-950/50 hover:bg-danger/10 hover:text-danger transition-colors"
                      title="Delete permanently"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalProduct !== undefined && (
        <ProductFormModal
          categorySlug={categorySlug}
          product={modalProduct}
          onClose={() => setModalProduct(undefined)}
          onSaved={() => {
            setModalProduct(undefined);
            load();
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this product?"
          message={`"${deleteTarget.title}" and all its images will be permanently deleted from the database and Cloudinary. This can't be undone. Past orders that included this product will still display correctly.`}
          confirmLabel={deleting ? "Deleting…" : "Delete permanently"}
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AppLayout>
  );
}
