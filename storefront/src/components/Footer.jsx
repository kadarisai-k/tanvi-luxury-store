import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { STORE_WHATSAPP_DISPLAY, STORE_EMAIL } from "../constants/contact";

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <h3 className="font-display text-xl mb-3">Sri Tanvi Enterprises</h3>
          <p className="text-sm text-white/60 leading-relaxed max-w-xs">
            Curated kitchenware, heirloom jewellery, and timeless photo memories — handpicked
            for the modern Indian home.
          </p>
          <div className="flex items-center gap-4 mt-5">
            <a href="#" aria-label="Instagram" className="text-white/70 hover:text-gold-400 transition-colors">
              <InstagramIcon size={18} className="w-[18px] h-[18px]" />
            </a>
            <a href="#" aria-label="Chat with us" className="text-white/70 hover:text-gold-400 transition-colors">
              <MessageCircle size={18} strokeWidth={1.5} />
            </a>
          </div>
        </div>

        <FooterColumn
          title="Shop"
          links={[
            { label: "Kitchen Products", to: "/shop/kitchen" },
            { label: "Jewellery", to: "/shop/jewellery" },
            { label: "Photo Frames", to: "/shop/photo_frames" },
            { label: "Photo Albums & Books", to: "/shop/photo_albums" },
          ]}
        />

        <FooterColumn
          title="Support"
          links={[
            { label: "Shipping Policy", to: "/shipping-policy" },
            { label: "Return Policy", to: "/return-policy" },
            { label: "Privacy Policy", to: "/privacy-policy" },
            { label: "Terms of Service", to: "/terms" },
          ]}
        />

        <div>
          <h4 className="eyebrow !text-white/50 mb-4">Contact</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-white/70">
            <li>WhatsApp: {STORE_WHATSAPP_DISPLAY}</li>
            <li>Email: {STORE_EMAIL}</li>
            <li>Hyderabad, Telangana, India</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <p className="text-center text-xs text-white/40">
          © {new Date().getFullYear()} Sri Tanvi Enterprises. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h4 className="eyebrow !text-white/50 mb-4">{title}</h4>
      <ul className="flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-sm text-white/70 hover:text-gold-400 transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
