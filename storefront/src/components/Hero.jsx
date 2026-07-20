import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[640px]">
      <div className="flex flex-col justify-center px-6 lg:px-16 py-16 lg:py-0 bg-cream">
        <span className="eyebrow mb-5">Est. Hyderabad</span>
        <h1 className="font-display text-5xl lg:text-6xl leading-[1.08] text-ink max-w-lg">
          Timeless Treasures for Every Home
        </h1>
        <p className="mt-6 text-base text-muted leading-relaxed max-w-md">
          Handpicked kitchenware, jewellery &amp; photo memories. Every piece is chosen with
          care — for the rituals, the celebrations, and the everyday.
        </p>
        <div className="flex flex-wrap gap-4 mt-9">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-ink text-cream text-sm font-medium px-7 py-3.5 hover:bg-ink/90 transition-colors"
          >
            Shop the Collection <ArrowRight size={15} />
          </Link>
          <Link
            to="/shop/jewellery"
            className="inline-flex items-center gap-2 border border-ink text-ink text-sm font-medium px-7 py-3.5 hover:bg-ink hover:text-cream transition-colors"
          >
            Explore Jewellery
          </Link>
        </div>
      </div>

      <div className="min-h-[360px] lg:min-h-0 bg-ink">
        <img
          src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1400&auto=format&fit=crop"
          alt="Curated home interior"
          className="w-full h-full object-cover"
        />
      </div>
    </section>
  );
}
