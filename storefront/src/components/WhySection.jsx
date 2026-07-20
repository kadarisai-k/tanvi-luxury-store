import { Sparkles, ShieldCheck, Truck, HeartHandshake } from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Curated Craftsmanship",
    desc: "Every product is chosen for quality, story and artistry.",
  },
  {
    icon: ShieldCheck,
    title: "Secure UPI Checkout",
    desc: "Pay directly via UPI — safe, fast and familiar.",
  },
  {
    icon: Truck,
    title: "Pan-India Delivery",
    desc: "Delivered to your door with careful, tracked shipping.",
  },
  {
    icon: HeartHandshake,
    title: "Personal Service",
    desc: "WhatsApp us anytime — we treat every order like a gift.",
  },
];

export default function WhySection() {
  return (
    <section className="bg-charcoal text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <span className="eyebrow !text-gold-400">Why Sri Tanvi</span>
        <h2 className="font-display text-4xl lg:text-5xl mt-3 max-w-xl leading-[1.15]">
          Crafted with intention. Delivered with care.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mt-14">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title}>
              <Icon size={26} strokeWidth={1.5} className="text-gold-400 mb-4" />
              <h3 className="font-display text-lg mb-1.5">{title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
