import { useMemo, useState } from "react";
import { Search, GripVertical } from "lucide-react";

const CATEGORY_LABELS = {
  kitchen: "Kitchen",
  jewellery: "Jewellery",
  photo_frames: "Photo Frames",
  photo_albums: "Photo Albums",
};

// Multi-select grid of products with a hard cap on how many can be checked.
// `selectedIds` is an ordered array (display order = selection order, which
// becomes the order the products appear in on the storefront).
export default function ProductPicker({ products, selectedIds, onChange, max }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category !== "all" && p.category?.slug !== category) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, search, category]);

  const toggle = (id) => {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      if (selectedIds.length >= max) return;
      onChange([...selectedIds, id]);
    }
  };

  const selectedProducts = selectedIds
    .map((id) => products.find((p) => p._id === id))
    .filter(Boolean);

  const atLimit = selectedIds.length >= max;

  return (
    <div>
      {selectedProducts.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-medium text-ink-950/50 mb-2">
            Selected order (this is the order shown on the home page)
          </div>
          <ol className="flex flex-col gap-1.5">
            {selectedProducts.map((p, i) => (
              <li
                key={p._id}
                className="flex items-center gap-2.5 bg-gold-50/60 border border-gold-500/20 rounded-lg px-3 py-1.5 text-sm"
              >
                <GripVertical size={14} className="text-ink-950/25 shrink-0" />
                <span className="text-ink-950/40 tabular-nums w-4 shrink-0">{i + 1}.</span>
                <img
                  src={p.images?.[0]?.url}
                  alt=""
                  className="w-7 h-7 rounded object-cover border border-line bg-canvas shrink-0"
                />
                <span className="truncate flex-1 text-ink-950">{p.title}</span>
                <button
                  type="button"
                  onClick={() => toggle(p._id)}
                  className="text-xs text-danger hover:underline shrink-0"
                >
                  Remove
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-950/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-lg border border-line pl-9 pr-3 py-2 text-sm focus:border-plum-600 outline-none bg-surface"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm focus:border-plum-600 outline-none bg-surface"
        >
          <option value="all">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
            <option key={slug} value={slug}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="max-h-[420px] overflow-y-auto border border-line rounded-lg divide-y divide-line">
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-ink-950/40">No products found.</div>
        )}
        {filtered.map((p) => {
          const checked = selectedSet.has(p._id);
          const disabled = !checked && atLimit;
          return (
            <label
              key={p._id}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-canvas/60"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(p._id)}
                className="shrink-0 accent-plum-700"
              />
              <img
                src={p.images?.[0]?.url}
                alt=""
                className="w-9 h-9 rounded-lg object-cover border border-line bg-canvas shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-ink-950">{p.title}</span>
                <span className="block text-xs text-ink-950/40">
                  {CATEGORY_LABELS[p.category?.slug] || p.category?.slug} · ₹
                  {p.price?.toLocaleString("en-IN")}
                </span>
              </span>
              {!p.isActive && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-ink-950/10 text-ink-950/50 shrink-0">
                  Hidden
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
