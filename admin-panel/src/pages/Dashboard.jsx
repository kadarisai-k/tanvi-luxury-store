import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import StatCard from "../components/StatCard";
import { getDashboardStats } from "../api/endpoints";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setError("Couldn't load dashboard stats."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">Dashboard</h1>
          <p className="text-sm text-ink-950/50 mt-0.5">Today's snapshot, at a glance.</p>
        </div>
      </div>

      {loading && <div className="text-sm text-ink-950/50">Loading…</div>}
      {error && <div className="text-sm text-danger">{error}</div>}

      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Orders today" value={stats.todayOrdersCount} />
            <StatCard
              label="Orders this month"
              value={stats.monthOrdersCount}
              sublabel="paid orders"
              accent="plum"
            />
            <StatCard
              label="Revenue this month"
              value={`₹${stats.monthRevenue.toLocaleString("en-IN")}`}
              accent="gold"
            />
            <StatCard label="Active products" value={stats.totalActiveProducts} />
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Recent orders */}
            <div className="bg-surface rounded-xl2 shadow-card p-5 max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-ink-950">Recent orders</h2>
                <Link to="/orders" className="text-xs font-medium text-plum-700 hover:underline">
                  View all
                </Link>
              </div>
              {stats.recentOrders.length === 0 ? (
                <p className="text-sm text-ink-950/50">No orders yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {stats.recentOrders.map((o) => (
                    <li key={o._id} className="py-2.5 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink-950 truncate">
                          {o.orderNumber}
                        </div>
                        <div className="text-xs text-ink-950/50 truncate">
                          {o.user?.name || o.user?.email || "Guest"}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-ink-950 shrink-0">
                        ₹{o.totalAmount.toLocaleString("en-IN")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
