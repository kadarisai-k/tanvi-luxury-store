import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { getCategoryGstRates, updateCategoryGst } from "../api/endpoints";

const CATEGORY_LABELS = {
  kitchen: "Kitchen",
  jewellery: "Jewellery",
  photo_frames: "Photo Frames",
  photo_albums: "Photo Albums",
};

export default function GstSettings() {
  const [categories, setCategories] = useState([]);
  const [values, setValues] = useState({}); // { [categoryId]: "15" }
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    getCategoryGstRates()
      .then((cats) => {
        setCategories(cats);
        const initial = {};
        cats.forEach((c) => {
          initial[c._id] = String(c.gstPercent ?? 0);
        });
        setValues(initial);
      })
      .catch(() => setError("Couldn't load GST settings."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (id, value) => {
    // Digits and a single optional decimal point only.
    if (value !== "" && !/^\d{0,3}(\.\d{0,2})?$/.test(value)) return;
    setValues((v) => ({ ...v, [id]: value }));
  };

  const handleSave = async (category) => {
    const raw = values[category._id];
    const gstPercent = Number(raw);
    if (raw === "" || Number.isNaN(gstPercent) || gstPercent < 0 || gstPercent > 100) {
      setError(`Enter a valid GST percentage (0–100) for ${CATEGORY_LABELS[category.slug] || category.name}.`);
      return;
    }
    setError("");
    setSavingId(category._id);
    try {
      const updated = await updateCategoryGst(category._id, gstPercent);
      setCategories((cats) => cats.map((c) => (c._id === updated._id ? updated : c)));
      setValues((v) => ({ ...v, [updated._id]: String(updated.gstPercent) }));
      setSavedId(updated._id);
      setTimeout(() => setSavedId(null), 2000);
    } catch {
      setError("Couldn't save this GST rate. Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink-950">GST Settings</h1>
        <p className="text-sm text-ink-950/50 mt-0.5">
          Set the GST percentage charged for each category. This is added on top of the item
          price automatically at checkout — customers see it broken out as a separate line in
          the billing.
        </p>
      </div>

      {loading && <div className="text-sm text-ink-950/50">Loading…</div>}

      {!loading && (
        <div className="bg-surface rounded-xl2 shadow-card max-w-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-950/40">
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">GST %</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {categories.map((c) => (
                <tr key={c._id}>
                  <td className="px-5 py-3.5 font-medium text-ink-950">
                    {CATEGORY_LABELS[c.slug] || c.name}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        value={values[c._id] ?? ""}
                        onChange={(e) => handleChange(c._id, e.target.value)}
                        inputMode="decimal"
                        className="w-20 rounded-lg border border-line px-3 py-1.5 text-sm focus:border-plum-600 outline-none"
                        placeholder="0"
                      />
                      <span className="text-ink-950/50">%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleSave(c)}
                      disabled={savingId === c._id}
                      className="bg-plum-700 hover:bg-plum-800 disabled:opacity-60 text-white rounded-lg px-4 py-1.5 text-xs font-medium transition-colors"
                    >
                      {savingId === c._id ? "Saving…" : savedId === c._id ? "Saved ✓" : "Save"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2 mt-4 max-w-xl">
          {error}
        </div>
      )}
    </AppLayout>
  );
}
