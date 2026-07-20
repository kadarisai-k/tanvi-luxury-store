import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, User, ShoppingBag, X, LogOut, Package } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { suggestProducts } from "../api/endpoints";
import LoginModal from "./LoginModal";

const NAV_LINKS = [
  { to: "/shop/kitchen", label: "Kitchen" },
  { to: "/shop/jewellery", label: "Jewellery" },
  { to: "/shop/photo_frames", label: "Frames" },
  { to: "/shop/photo_albums", label: "Albums" },
  { to: "/shop", label: "Shop All" },
];

export default function Header() {
  const { itemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const searchBoxRef = useRef(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // Live search: as the person types each letter, fetch matching products
  // and show them in a dropdown. Debounced so we're not firing a request
  // on every single keystroke.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setSuggestLoading(false);
      return;
    }
    setSuggestLoading(true);
    const timer = setTimeout(() => {
      suggestProducts(trimmed)
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
        .finally(() => setSuggestLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Close the suggestions dropdown when clicking anywhere outside it.
  useEffect(() => {
    if (!searchOpen) return;
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
    setSuggestions([]);
  };

  const handleSuggestionClick = (product) => {
    navigate(`/product/${product.slug}`);
    closeSearch();
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault?.();
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      closeSearch();
    }
  };

  const handleAccountClick = () => {
    if (isAuthenticated) {
      setAccountMenuOpen((v) => !v);
    } else {
      setLoginOpen(true);
    }
  };

  const initials = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <header className="bg-cream border-b border-line sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-24 flex items-center justify-between gap-6">
        <Link to="/" className="shrink-0">
          <span className="font-display text-2xl lg:text-[1.7rem] text-ink">
            Sri Tanvi <em className="italic text-gold-500">Enterprises</em>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                `nav-link pb-1 border-b transition-colors ${
                  isActive
                    ? "text-gold-500 border-gold-500"
                    : "text-ink border-transparent hover:text-gold-500"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-5 shrink-0">
          {searchOpen ? (
            <div ref={searchBoxRef} className="relative">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products…"
                  className="w-32 sm:w-40 lg:w-56 border-b border-ink bg-transparent text-sm py-1 outline-none placeholder:text-muted"
                />
                <button type="button" onClick={closeSearch} className="text-ink/60">
                  <X size={16} />
                </button>
              </form>

              {query.trim() && (
                <div className="absolute right-0 top-9 w-72 sm:w-80 bg-cream border border-line shadow-lg z-50 max-h-96 overflow-y-auto">
                  {suggestLoading && (
                    <div className="px-4 py-3 text-sm text-muted">Searching…</div>
                  )}
                  {!suggestLoading && suggestions.length === 0 && (
                    <div className="px-4 py-3 text-sm text-muted">No products found.</div>
                  )}
                  {!suggestLoading &&
                    suggestions.map((product) => (
                      <button
                        key={product._id}
                        onClick={() => handleSuggestionClick(product)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-line/50 transition-colors"
                      >
                        <img
                          src={product.images?.[0]?.url}
                          alt=""
                          className="w-10 h-10 object-cover bg-line shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-ink truncate">{product.title}</div>
                          <div className="text-xs text-muted">
                            {product.category?.name}
                          </div>
                        </div>
                        <div className="text-sm text-ink shrink-0">
                          ₹{product.price?.toLocaleString("en-IN")}
                        </div>
                      </button>
                    ))}
                  {!suggestLoading && suggestions.length > 0 && (
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full text-center px-4 py-2.5 text-xs text-gold-600 hover:bg-line/50 border-t border-line"
                    >
                      See all results for "{query.trim()}"
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-1.5 nav-link text-ink border-b border-ink/40 pb-0.5 hover:border-gold-500 hover:text-gold-500 transition-colors"
              >
                <Search size={15} /> Search
              </button>
              <button
                onClick={() => setSearchOpen(true)}
                className="sm:hidden text-ink hover:text-gold-500 transition-colors"
                aria-label="Search"
              >
                <Search size={20} strokeWidth={1.5} />
              </button>
            </>
          )}

          <div className="relative">
            <button
              onClick={handleAccountClick}
              className="text-ink hover:text-gold-500 transition-colors"
              aria-label="Account"
            >
              {isAuthenticated ? (
                <span className="w-5 h-5 rounded-full bg-ink text-cream text-[11px] font-semibold flex items-center justify-center">
                  {initials}
                </span>
              ) : (
                <User size={20} strokeWidth={1.5} />
              )}
            </button>

            {accountMenuOpen && isAuthenticated && (
              <div className="absolute right-0 top-9 bg-surface bg-cream border border-line shadow-lg w-48 py-2 z-50">
                <div className="px-4 py-2 text-xs text-muted truncate border-b border-line mb-1">
                  {user?.email}
                </div>
                <Link
                  to="/account"
                  onClick={() => setAccountMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-line/60"
                >
                  <Package size={14} /> My Orders
                </Link>
                <button
                  onClick={() => {
                    setAccountMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-line/60"
                >
                  <LogOut size={14} /> Log out
                </button>
              </div>
            )}
          </div>

          <Link to="/cart" className="relative text-ink hover:text-gold-500 transition-colors">
            <ShoppingBag size={20} strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-ink text-cream text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="lg:hidden flex items-center gap-5 overflow-x-auto px-6 pb-3 -mt-1">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              `nav-link whitespace-nowrap ${isActive ? "text-gold-500" : "text-ink/70"}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </header>
  );
}
