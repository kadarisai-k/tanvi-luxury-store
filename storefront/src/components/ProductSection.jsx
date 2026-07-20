import { AlertCircle } from "lucide-react";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";

export default function ProductSection({ eyebrow, title, products, loading, error }) {
  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
      <div className="mb-10">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="font-display text-4xl text-ink mt-2">{title}</h2>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-muted py-6">
          <AlertCircle size={16} />
          Couldn't load these products right now. Please try refreshing the page.
        </div>
      )}

      {!error && !loading && products.length === 0 && (
        <p className="text-sm text-muted">Nothing here yet — check back soon.</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        {!loading && !error && products.map((p) => <ProductCard key={p._id} product={p} />)}
      </div>
    </section>
  );
}
