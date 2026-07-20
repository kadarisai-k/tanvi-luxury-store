import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CATEGORY_CARDS = [
  {
    slug: "kitchen",
    label: "Kitchen",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop",
  },
  {
    slug: "jewellery",
    label: "Jewellery",
    image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?q=80&w=800&auto=format&fit=crop",
  },
  {
    slug: "photo_frames",
    label: "Photo Frames",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800&auto=format&fit=crop",
  },
  {
    slug: "photo_albums",
    label: "Photo Albums",
    image: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=800&auto=format&fit=crop",
  },
];

export default function CategoryGrid() {
  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <span className="eyebrow">Curated Categories</span>
          <h2 className="font-display text-4xl text-ink mt-2">Shop by Story</h2>
        </div>
        <Link
          to="/shop"
          className="hidden sm:inline-flex items-center gap-1.5 nav-link text-ink hover:text-gold-500 transition-colors"
        >
          View All <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {CATEGORY_CARDS.map((cat) => (
          <Link key={cat.slug} to={`/shop/${cat.slug}`} className="group block">
            <div className="aspect-[3/4] overflow-hidden bg-line">
              <img
                src={cat.image}
                alt={cat.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <h3 className="font-display text-lg text-ink mt-3 group-hover:text-gold-500 transition-colors">
              {cat.label}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
