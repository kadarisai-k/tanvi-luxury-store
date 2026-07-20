import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ChefHat,
  Gem,
  Image,
  BookImage,
  Package,
  Percent,
  Home as HomeIcon,
  LogOut,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const categoryLinks = [
  { to: "/products/kitchen", label: "Kitchen", icon: ChefHat },
  { to: "/products/jewellery", label: "Jewellery", icon: Gem },
  { to: "/products/photo_frames", label: "Photo Frames", icon: Image },
  { to: "/products/photo_albums", label: "Photo Albums", icon: BookImage },
];

function NavItem({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-plum-700 text-white"
            : "text-ink-950/70 hover:bg-plum-50 hover:text-ink-950"
        }`
      }
    >
      <Icon size={18} strokeWidth={2} />
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { admin, logout } = useAdminAuth();

  return (
    <aside className="w-64 shrink-0 bg-surface border-r border-line h-screen sticky top-0 flex flex-col">
      <div className="px-6 py-6 border-b border-line">
        <div className="font-display text-xl font-semibold text-ink-950 tracking-tight">
          Tanvi
        </div>
        <div className="text-xs uppercase tracking-[0.14em] text-gold-600 font-medium mt-0.5">
          Luxury Store — Admin
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 flex flex-col gap-1 overflow-y-auto">
        <NavItem to="/" label="Dashboard" Icon={LayoutDashboard} />

        <div className="mt-5 mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-ink-950/40">
          Products
        </div>
        {categoryLinks.map((c) => (
          <NavItem key={c.to} to={c.to} label={c.label} Icon={c.icon} />
        ))}

        <div className="mt-5 mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-ink-950/40">
          Sales
        </div>
        <NavItem to="/orders" label="Orders" Icon={Package} />

        <div className="mt-5 mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-ink-950/40">
          Tax
        </div>
        <NavItem to="/settings/gst" label="GST" Icon={Percent} />

        <div className="mt-5 mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-ink-950/40">
          Store
        </div>
        <NavItem to="/home-page-edits" label="Home Page Edits" Icon={HomeIcon} />
      </nav>

      <div className="px-3 py-4 border-t border-line">
        <div className="px-4 py-2 text-sm text-ink-950/60 truncate">{admin?.email}</div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl2 text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </aside>
  );
}
