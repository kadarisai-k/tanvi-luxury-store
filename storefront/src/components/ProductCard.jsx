import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  const discount =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="aspect-[4/5] bg-line overflow-hidden">
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-sm">
            No image
          </div>
        )}
      </div>
      <div className="pt-4">
        <h3 className="font-display text-lg text-ink leading-snug">{product.title}</h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm font-medium text-ink">
            ₹{product.price?.toLocaleString("en-IN")}
          </span>
          {discount > 0 && (
            <>
              <span className="text-xs text-muted line-through">
                ₹{product.mrp?.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-gold-600 font-medium">{discount}% off</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
