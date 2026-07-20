import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, LogOut } from "lucide-react";
import Layout from "../components/Layout";
import LoginModal from "../components/LoginModal";
import { useAuth } from "../context/AuthContext";
import { getMyOrders } from "../api/endpoints";

const STATUS_STYLES = {
  placed: "bg-gold-400/15 text-gold-600",
  confirmed: "bg-gold-400/15 text-gold-600",
  shipped: "bg-blue-500/10 text-blue-700",
  delivered: "bg-green-600/10 text-green-700",
  cancelled: "bg-red-500/10 text-red-600",
};

export default function Account() {
  const { user, isAuthenticated, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    getMyOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <span className="eyebrow">Your Account</span>
          <h1 className="font-display text-3xl text-ink mt-2 mb-4">Sign in to continue</h1>
          <p className="text-muted mb-8">
            View your order history and manage your account with a quick email code — no
            password needed.
          </p>
          <button
            onClick={() => setLoginOpen(true)}
            className="bg-ink text-cream text-sm font-medium px-8 py-3.5 hover:bg-ink/90 transition-colors"
          >
            Sign in with email
          </button>
        </div>
        {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-14">
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="eyebrow">Your Account</span>
            <h1 className="font-display text-3xl text-ink mt-2">{user?.name || user?.email}</h1>
            {user?.name && <p className="text-sm text-muted mt-1">{user.email}</p>}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-red-600 hover:underline shrink-0"
          >
            <LogOut size={15} /> Log out
          </button>
        </div>

        <h2 className="font-display text-xl text-ink mb-5">Order history</h2>

        {loading && <div className="text-sm text-muted">Loading…</div>}

        {!loading && orders.length === 0 && (
          <div className="text-center py-16 border border-line">
            <Package size={28} className="mx-auto text-muted mb-3" strokeWidth={1.5} />
            <p className="text-muted mb-5">You haven't placed any orders yet.</p>
            <Link to="/shop" className="nav-link text-gold-500 border-b border-gold-500 pb-0.5">
              Start shopping
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order._id} className="border border-line px-6 py-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-medium text-ink">{order.orderNumber}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {new Date(order.placedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    ·{" "}
                    {new Date(order.placedAt).toLocaleTimeString("en-IN", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[order.orderStatus]}`}
                >
                  {order.orderStatus}
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-1.5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-ink/80">
                    <span>
                      {item.title} × {item.quantity}
                    </span>
                    <span>₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm font-medium text-ink mt-4 pt-4 border-t border-line">
                <span>Total</span>
                <span>₹{order.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
