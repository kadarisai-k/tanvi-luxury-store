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
  X,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const categoryLinks = [
  { to: "/products/kitchen", label: "Kitchen", icon: ChefHat },
  { to: "/products/jewellery", label: "Jewellery", icon: Gem },
  { to: "/products/photo_frames", label: "Photo Frames", icon: Image },
  { to: "/products/photo_albums", label: "Photo Albums", icon: BookImage },
];

function NavItem({ to, label, Icon, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
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

// `open`/`onClose` only matter on mobile (below the `lg` breakpoint), where
// the sidebar becomes an off-canvas drawer instead of always taking up
// screen width. On desktop it's simply always visible, same as before.
export default function Sidebar({ open, onClose }) {
  const { admin, logout } = useAdminAuth();

  return (
    <>
      {/* Dimmed backdrop behind the drawer, mobile only. Tapping it closes
          the menu, same as tapping outside any dropdown. */}
      {open && (
        <div
          className="fixed inset-0 bg-ink-950/40 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-64 shrink-0 bg-surface border-r border-line h-screen flex flex-col fixed top-0 left-0 z-50 transition-transform duration-200 lg:sticky lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 py-6 border-b border-line flex items-center justify-between">
          <div>
            <div className="font-display text-xl font-semibold text-ink-950 tracking-tight">
              Tanvi
            </div>
            <div className="text-xs uppercase tracking-[0.14em] text-gold-600 font-medium mt-0.5">
              Luxury Store — Admin
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-ink-950/50 hover:text-ink-950 p-1"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 flex flex-col gap-1 overflow-y-auto">
          <NavItem to="/" label="Dashboard" Icon={LayoutDashboard} onNavigate={onClose} />

          <div className="mt-5 mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-ink-950/40">
            Products
          </div>
          {categoryLinks.map((c) => (
            <NavItem key={c.to} to={c.to} label={c.label} Icon={c.icon} onNavigate={onClose} />
          ))}

          <div className="mt-5 mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-ink-950/40">
            Sales
          </div>
          <NavItem to="/orders" label="Orders" Icon={Package} onNavigate={onClose} />

          <div className="mt-5 mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-ink-950/40">
            Tax
          </div>
          <NavItem to="/settings/gst" label="GST" Icon={Percent} onNavigate={onClose} />

          <div className="mt-5 mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-ink-950/40">
            Store
          </div>
          <NavItem to="/home-page-edits" label="Home Page Edits" Icon={HomeIcon} onNavigate={onClose} />
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
    </>
  );
}
