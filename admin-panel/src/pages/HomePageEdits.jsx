import { useEffect, useState, useCallback } from "react";
import AppLayout from "../components/AppLayout";
import ProductPicker from "../components/ProductPicker";
import {
  getAdminProducts,
  getSettings,
  updateSettings,
  getHomeSectionSettings,
  updateHomeSectionSettings,
} from "../api/endpoints";

const MAX_PICKS = 8;

// A single collapsible-ish card with its own save button and status message,
// used for all three sections on this page so they can be saved independently.
function SectionCard({ title, description, children, onSave, saving, saved, error }) {
  return (
    <div className="bg-surface rounded-xl2 shadow-card p-5">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-ink-950">{title}</h2>
        {description && <p className="text-sm text-ink-950/50 mt-0.5">{description}</p>}
      </div>

      {children}

      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-line">
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-plum-700 hover:bg-plum-800 disabled:opacity-60 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && <span className="text-sm text-success">Saved.</span>}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </div>
  );
}

export default function HomePageEdits() {
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState([]);

  // Announcement bar
  const [announcementText, setAnnouncementText] = useState("");
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [savedAnnouncement, setSavedAnnouncement] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");

  // Featured products
  const [featuredIds, setFeaturedIds] = useState([]);
  const [savingFeatured, setSavingFeatured] = useState(false);
  const [savedFeatured, setSavedFeatured] = useState(false);
  const [featuredError, setFeaturedError] = useState("");

  // Best sellers
  const [bestSellerIds, setBestSellerIds] = useState([]);
  const [savingBestSellers, setSavingBestSellers] = useState(false);
  const [savedBestSellers, setSavedBestSellers] = useState(false);
  const [bestSellersError, setBestSellersError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      getAdminProducts({ limit: 500 }),
      getSettings(),
      getHomeSectionSettings(),
    ])
      .then(([productsData, settings, homeSections]) => {
        setAllProducts(productsData.products);
        setAnnouncementText(settings.announcementText || "");
        setFeaturedIds(homeSections.featuredProducts.map((p) => p._id));
        setBestSellerIds(homeSections.bestSellerProducts.map((p) => p._id));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (setSaved) => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSaveAnnouncement = async () => {
    setSavingAnnouncement(true);
    setAnnouncementError("");
    setSavedAnnouncement(false);
    try {
      const s = await updateSettings({ announcementText });
      setAnnouncementText(s.announcementText || "");
      flash(setSavedAnnouncement);
    } catch {
      setAnnouncementError("Couldn't save. Please try again.");
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleSaveFeatured = async () => {
    setSavingFeatured(true);
    setFeaturedError("");
    setSavedFeatured(false);
    try {
      const data = await updateHomeSectionSettings({ featuredProductIds: featuredIds });
      setFeaturedIds(data.featuredProducts.map((p) => p._id));
      flash(setSavedFeatured);
    } catch {
      setFeaturedError("Couldn't save. Please try again.");
    } finally {
      setSavingFeatured(false);
    }
  };

  const handleSaveBestSellers = async () => {
    setSavingBestSellers(true);
    setBestSellersError("");
    setSavedBestSellers(false);
    try {
      const data = await updateHomeSectionSettings({ bestSellerProductIds: bestSellerIds });
      setBestSellerIds(data.bestSellerProducts.map((p) => p._id));
      flash(setSavedBestSellers);
    } catch {
      setBestSellersError("Couldn't save. Please try again.");
    } finally {
      setSavingBestSellers(false);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink-950">Home Page Edits</h1>
        <p className="text-sm text-ink-950/50 mt-0.5">
          Control what customers see on the storefront home page.
        </p>
      </div>

      {loading && <div className="text-sm text-ink-950/50">Loading…</div>}

      {!loading && (
        <div className="flex flex-col gap-6 max-w-3xl">
          <SectionCard
            title="Announcement bar"
            description="Shown as a thin strip at the very top of the home page. Leave this blank and nothing will be shown there."
            onSave={handleSaveAnnouncement}
            saving={savingAnnouncement}
            saved={savedAnnouncement}
            error={announcementError}
          >
            <input
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              maxLength={300}
              placeholder="e.g. Complimentary shipping on orders above ₹999 · Handpicked with love from Hyderabad"
              className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-plum-600 outline-none"
            />
            <p className="text-xs text-ink-950/30 mt-1 text-right">
              {announcementText.length}/300
            </p>
          </SectionCard>

          <SectionCard
            title="Featured Pieces"
            description={`Pick up to ${MAX_PICKS} products to show in the "Featured Pieces" rail. If you don't pick any, the home page will automatically show 2 random products from each category instead.`}
            onSave={handleSaveFeatured}
            saving={savingFeatured}
            saved={savedFeatured}
            error={featuredError}
          >
            <div className="text-xs font-medium text-ink-950/50 mb-3">
              {featuredIds.length}/{MAX_PICKS} selected
            </div>
            <ProductPicker
              products={allProducts}
              selectedIds={featuredIds}
              onChange={setFeaturedIds}
              max={MAX_PICKS}
            />
          </SectionCard>

          <SectionCard
            title="Best Sellers"
            description={`Pick up to ${MAX_PICKS} products to show in the "Best Sellers" rail. If you don't pick any, the home page will automatically rank products by actual units sold - and if nothing has sold yet, it'll show 2 random products from each category instead.`}
            onSave={handleSaveBestSellers}
            saving={savingBestSellers}
            saved={savedBestSellers}
            error={bestSellersError}
          >
            <div className="text-xs font-medium text-ink-950/50 mb-3">
              {bestSellerIds.length}/{MAX_PICKS} selected
            </div>
            <ProductPicker
              products={allProducts}
              selectedIds={bestSellerIds}
              onChange={setBestSellerIds}
              max={MAX_PICKS}
            />
          </SectionCard>
        </div>
      )}
    </AppLayout>
  );
}
