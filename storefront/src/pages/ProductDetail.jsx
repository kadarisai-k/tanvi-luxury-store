import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Check, ChevronDown } from "lucide-react";
import Layout from "../components/Layout";
import { getProductBySlug } from "../api/endpoints";
import { useCart } from "../context/CartContext";

const CATEGORY_LABELS = {
  kitchen: "Kitchen",
  jewellery: "Jewellery",
  photo_frames: "Photo Frames",
  photo_albums: "Photo Albums",
};

export default function ProductDetail() {
  const { slug } = useParams();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(""); // label of the chosen size variant, if any
  const [added, setAdded] = useState(false);
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    setActiveImage(0);
    setAdded(false);
    getProductBySlug(slug)
      .then((p) => {
        setProduct(p);
        // Default to the first available size, so the price shown always
        // matches what "Add to Bag" would actually charge.
        setSelectedSize(p?.sizeVariants?.[0]?.label || "");
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 text-center text-muted">
          Loading…
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 text-center">
          <p className="text-muted mb-4">This product couldn't be found.</p>
          <Link to="/shop" className="nav-link text-gold-500 border-b border-gold-500 pb-0.5">
            Continue shopping
          </Link>
        </div>
      </Layout>
    );
  }

  const hasSizeVariants = product.sizeVariants?.length > 0;
  const activeVariant = hasSizeVariants
    ? product.sizeVariants.find((v) => v.label === selectedSize) || product.sizeVariants[0]
    : null;
  const effectivePrice = activeVariant ? activeVariant.price : product.price;

  const discount =
    product.mrp && product.mrp > effectivePrice
      ? Math.round(((product.mrp - effectivePrice) / product.mrp) * 100)
      : 0;

  const attrs = Object.entries(product.attributes || {}).filter(([, v]) => v);

  const handleAddToCart = async () => {
    setAddError("");
    setAdding(true);
    const result = await addItem(product, quantity, activeVariant?.label || "");
    setAdding(false);
    if (result.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } else {
      setAddError(result.error);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <div>
          <div className="aspect-square bg-line overflow-hidden">
            {product.images?.[activeImage]?.url && (
              <img
                src={product.images[activeImage].url}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-3 mt-4">
              {product.images.map((img, idx) => (
                <button
                  key={img.publicId}
                  onClick={() => setActiveImage(idx)}
                  className={`w-16 h-16 overflow-hidden border ${
                    activeImage === idx ? "border-ink" : "border-line"
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <span className="eyebrow">{CATEGORY_LABELS[product.category?.slug] || product.category?.name}</span>
          <h1 className="font-display text-4xl text-ink mt-2 leading-tight">{product.title}</h1>

          <div className="flex items-center gap-3 mt-5">
            <span className="text-2xl font-medium text-ink">
              ₹{effectivePrice?.toLocaleString("en-IN")}
            </span>
            {discount > 0 && (
              <>
                <span className="text-base text-muted line-through">
                  ₹{product.mrp?.toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-gold-600 font-medium">{discount}% off</span>
              </>
            )}
          </div>

          {hasSizeVariants && (
            <div className="mt-6 max-w-xs">
              <label className="text-xs uppercase tracking-wide text-muted">
                Size <span className="text-ink">({activeVariant?.label})</span>
              </label>
              <div className="relative mt-2">
                <select
                  value={activeVariant?.label || ""}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full appearance-none border border-line rounded-full px-5 py-3 text-sm text-ink bg-transparent focus:border-ink outline-none cursor-pointer"
                >
                  {product.sizeVariants.map((v) => (
                    <option key={v.label} value={v.label}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
                />
              </div>
            </div>
          )}

          {product.description && (
            <p className="text-sm text-muted leading-relaxed mt-6 max-w-md">{product.description}</p>
          )}

          {attrs.length > 0 && (
            <dl className="grid grid-cols-2 gap-y-2 mt-6 max-w-md text-sm">
              {attrs.map(([key, value]) => (
                <div key={key} className="contents">
                  <dt className="text-muted capitalize">{key}</dt>
                  <dd className="text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-8">
            {product.stock > 0 ? (
              <span className="text-xs text-gold-600 font-medium">
                {product.stock <= 5 ? `Only ${product.stock} left` : "In stock"}
              </span>
            ) : (
              <span className="text-xs text-red-600 font-medium">Out of stock</span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center border border-line">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-3 text-ink hover:text-gold-500"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                className="p-3 text-ink hover:text-gold-500"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || adding}
              className="flex-1 flex items-center justify-center gap-2 bg-ink text-cream text-sm font-medium py-3.5 disabled:opacity-40 hover:bg-ink/90 transition-colors"
            >
              {added ? (
                <>
                  <Check size={16} /> Added to bag
                </>
              ) : (
                <>
                  <ShoppingBag size={16} /> {adding ? "Adding…" : "Add to Bag"}
                </>
              )}
            </button>
          </div>

          {addError && (
            <p className="text-sm text-red-600 mt-3">{addError}</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
