import { useEffect, useState, useCallback } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import AppLayout from "../components/AppLayout";
import OrderDetailDrawer from "../components/OrderDetailDrawer";
import { getAdminOrders, downloadOrdersExport } from "../api/endpoints";

const STATUS_STYLES = {
  placed: "bg-plum-50 text-plum-700",
  confirmed: "bg-gold-400/10 text-gold-600",
  shipped: "bg-warn/10 text-warn",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(daysAgoISO(30));
  const [to, setTo] = useState(todayISO());
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getAdminOrders({ from, to, status: status || undefined, limit: 100 })
      .then((data) => {
        setOrders(data.orders);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [from, to, status]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      await downloadOrdersExport({ from, to, status: status || undefined }, format);
    } finally {
      setExporting(false);
    }
  };

  const setQuickRange = (days) => {
    setFrom(daysAgoISO(days));
    setTo(todayISO());
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">Orders</h1>
          <p className="text-sm text-ink-950/50 mt-0.5">{total} order{total !== 1 && "s"} in range</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("xlsx")}
            disabled={exporting}
            className="flex items-center gap-2 border border-line bg-surface text-sm font-medium text-ink-950/70 rounded-lg px-3.5 py-2.5 hover:bg-canvas transition-colors"
          >
            <FileSpreadsheet size={15} /> Excel
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={exporting}
            className="flex items-center gap-2 border border-line bg-surface text-sm font-medium text-ink-950/70 rounded-lg px-3.5 py-2.5 hover:bg-canvas transition-colors"
          >
            <FileText size={15} /> PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-xl2 shadow-card p-4 mb-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="text-xs font-medium text-ink-950/60">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 block rounded-lg border border-line px-3 py-2 text-sm focus:border-plum-600 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-950/60">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 block rounded-lg border border-line px-3 py-2 text-sm focus:border-plum-600 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-950/60">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block rounded-lg border border-line px-3 py-2 text-sm focus:border-plum-600 outline-none bg-surface"
          >
            <option value="">All</option>
            <option value="placed">Placed</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex gap-1.5 pb-0.5">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setQuickRange(d)}
              className="text-xs font-medium text-plum-700 bg-plum-50 rounded-full px-3 py-1.5 hover:bg-plum-100 transition-colors"
            >
              Last {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-xl2 shadow-card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-950/40">
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Payment</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-950/40">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink-950/40">
                  No orders in this range.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr
                key={o._id}
                onClick={() => setSelected(o)}
                className="hover:bg-canvas/60 cursor-pointer"
              >
                <td className="px-5 py-3 font-medium text-ink-950">{o.orderNumber}</td>
                <td className="px-5 py-3 text-ink-950/70">
                  <div>{new Date(o.placedAt).toLocaleDateString("en-IN")}</div>
                  <div className="text-xs text-ink-950/45">
                    {new Date(o.placedAt).toLocaleTimeString("en-IN", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </td>
                <td className="px-5 py-3 text-ink-950/70">
                  {o.user?.name || o.user?.email || "Guest"}
                </td>
                <td className="px-5 py-3 font-medium text-ink-950">
                  ₹{o.totalAmount?.toLocaleString("en-IN")}
                </td>
                <td className="px-5 py-3 text-ink-950/70">
                  {o.paymentInfo?.method === "cod" ? "COD" : "Online"}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_STYLES[o.orderStatus]}`}
                  >
                    {o.orderStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <OrderDetailDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setSelected(updated);
            setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
          }}
        />
      )}
    </AppLayout>
  );
}
