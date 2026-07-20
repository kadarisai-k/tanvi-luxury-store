import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Search, AlertCircle } from "lucide-react";
import Layout from "../components/Layout";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import { getProducts } from "../api/endpoints";

const CATEGORY_META = {
  kitchen: { title: "Kitchen Products" },
  jewellery: { title: "Jewellery" },
  photo_frames: { title: "Photo Frames" },
  photo_albums: { title: "Photo Albums & Books" },
};

export default function Shop() {
  const { categorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const meta = categorySlug ? CATEGORY_META[categorySlug] : { title: "Shop All" };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState("newest");

  // Debounce the search box so we're not firing a request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Re-sync from the URL when ?search= changes but the route itself doesn't
  // remount — e.g. using the navbar search box while already on /shop.
  useEffect(() => {
    const fromUrl = searchParams.get("search") || "";
    setSearchInput(fromUrl);
    setSearch(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getProducts({
      category: categorySlug || undefined,
      search: search || undefined,
      sort,
      limit: 40,
    })
      .then((data) => setProducts(data.products))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [categorySlug, search, sort]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        <span className="eyebrow">Collection</span>
        <h1 className="font-display text-4xl sm:text-5xl text-ink mt-2">{meta.title}</h1>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-10 pb-6 border-b border-line">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products"
              className="w-full border-b border-line bg-transparent pl-6 pr-2 py-2 text-sm outline-none focus:border-ink placeholder:text-muted"
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="eyebrow !text-ink/50">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-line bg-cream text-sm px-3 py-2 outline-none focus:border-ink"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="mt-12">
          {error && (
            <div className="flex flex-col items-center gap-2 text-center text-muted py-16">
              <AlertCircle size={22} />
              Couldn't load products right now. Please try refreshing the page.
            </div>
          )}

          {!error && !loading && products.length === 0 && (
            <div className="text-center text-muted py-16">No products found.</div>
          )}

          {!error && (loading || products.length > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {loading &&
                Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              {!loading && products.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
