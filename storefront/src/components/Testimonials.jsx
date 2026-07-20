import { Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "The brass handi is stunning — my mother-in-law couldn't stop admiring it at dinner.",
    name: "Ananya R.",
  },
  {
    quote: "Bought a kundan set for my sister's wedding — the finish looked far above the price.",
    name: "Priya S.",
  },
  {
    quote: "The wedding album felt like a keepsake, not just a product. Beautifully made.",
    name: "Rohan M.",
  },
];

export default function Testimonials() {
  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20 text-center">
      <span className="eyebrow">Kind Words</span>
      <h2 className="font-display text-4xl lg:text-5xl text-ink mt-3">Loved by our patrons</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 mt-14 text-left">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="border border-line px-7 py-8">
            <Quote size={20} className="text-gold-500 mb-4" strokeWidth={1.5} />
            <p className="font-display italic text-lg text-ink leading-relaxed">"{t.quote}"</p>
            <p className="nav-link text-muted mt-6">— {t.name.toUpperCase()}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
