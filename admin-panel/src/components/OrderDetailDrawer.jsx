import { useState } from "react";
import { X, Download, FolderInput, ExternalLink, MessageCircle } from "lucide-react";
import { updateOrderStatus, downloadInvoice } from "../api/endpoints";

const STATUS_OPTIONS = ["placed", "confirmed", "shipped", "delivered", "cancelled"];

const STATUS_STYLES = {
  placed: "bg-plum-50 text-plum-700",
  confirmed: "bg-gold-400/10 text-gold-600",
  shipped: "bg-warn/10 text-warn",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
};

export default function OrderDetailDrawer({ order, onClose, onUpdated }) {
  const [status, setStatus] = useState(order.orderStatus);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    setSaving(true);
    try {
      const updated = await updateOrderStatus(order._id, newStatus);
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    try {
      await downloadInvoice(order);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink-950/40 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl2 shadow-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-line px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-950">{order.orderNumber}</h2>
            <p className="text-xs text-ink-950/50">
              {new Date(order.placedAt).toLocaleString("en-IN")}
            </p>
          </div>
          <button onClick={onClose} className="text-ink-950/50 hover:text-ink-950">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Status */}
          <div>
            <label className="text-sm font-medium text-ink-950/80">Order status</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  disabled={saving}
                  onClick={() => handleStatusChange(s)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full capitalize transition-all ${
                    status === s
                      ? STATUS_STYLES[s] + " ring-1 ring-inset ring-current"
                      : "bg-canvas text-ink-950/40 hover:text-ink-950/70"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Customer */}
          <div>
            <label className="text-sm font-medium text-ink-950/80">Customer</label>
            <p className="text-sm text-ink-950 mt-1">
              {order.user?.name || "—"} · {order.user?.email}
            </p>
          </div>

          {/* Shipping address */}
          <div>
            <label className="text-sm font-medium text-ink-950/80">Shipping address</label>
            <p className="text-sm text-ink-950 mt-1">
              {order.shippingAddress?.name}
              <br />
              {order.shippingAddress?.line1} {order.shippingAddress?.line2}
              <br />
              {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
              {order.shippingAddress?.pincode}
              <br />
              Phone: {order.shippingAddress?.phone}
            </p>
          </div>

          {/* Items */}
          <div>
            <label className="text-sm font-medium text-ink-950/80">Items</label>
            <div className="mt-2 divide-y divide-line border border-line rounded-lg overflow-hidden">
              {order.items.map((item, idx) => {
                const customerPhone = (order.shippingAddress?.phone || "").replace(/\D/g, "");
                const customerWhatsappUrl = customerPhone
                  ? `https://wa.me/91${customerPhone}?text=${encodeURIComponent(
                      `Hi ${order.shippingAddress?.name || ""}, following up on your order ${order.orderNumber} - could you share the Google Drive link to your photos for "${item.title}"?`
                    )}`
                  : null;

                return (
                  <div key={idx} className="flex flex-col gap-2 px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} className="w-10 h-10 rounded-lg object-cover border border-line" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-ink-950 truncate">{item.title}</div>
                        <div className="text-xs text-ink-950/50">
                          Qty {item.quantity}
                          {item.sizeLabel && ` · Size: ${item.sizeLabel}`}
                          {item.gstPercent > 0 && ` · GST ${item.gstPercent}%`}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-ink-950">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </div>
                    </div>
                    {(item.category === "photo_frames" || item.category === "photo_albums") && (
                      <div className="ml-[52px] -mt-1">
                        {item.photoShareMethod === "drive" && item.driveLink ? (
                          <a
                            href={item.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-gold-600 hover:text-gold-700 bg-gold-400/10 px-2.5 py-1 rounded-full"
                          >
                            <FolderInput size={12} />
                            Open customer's photos
                            <ExternalLink size={11} />
                          </a>
                        ) : item.photoShareMethod === "whatsapp" ? (
                          customerWhatsappUrl ? (
                            <a
                              href={customerWhatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-success hover:opacity-80 bg-success/10 px-2.5 py-1 rounded-full"
                            >
                              <MessageCircle size={12} />
                              Get photos on WhatsApp
                              <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-full">
                              <MessageCircle size={12} />
                              Customer will share via WhatsApp
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warn bg-warn/10 px-2.5 py-1 rounded-full">
                            <FolderInput size={12} />
                            No photos link yet
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="text-sm text-ink-950/80 flex flex-col gap-1 border-t border-line pt-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{order.subtotal?.toLocaleString("en-IN")}</span>
            </div>
            {order.gstTotal > 0 && (
              <div className="flex justify-between">
                <span>GST</span>
                <span>₹{order.gstTotal.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>₹{order.shippingFee?.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between font-semibold text-ink-950 text-base pt-1">
              <span>Total</span>
              <span>₹{order.totalAmount?.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-xs text-ink-950/50 pt-1">
              <span>Payment method</span>
              <span className="capitalize">
                {order.paymentInfo?.method === "cod" ? "Cash on Delivery" : "Online (Razorpay)"}
              </span>
            </div>
            <div className="flex justify-between text-xs text-ink-950/50">
              <span>Payment status</span>
              <span className="capitalize">{order.paymentInfo?.status}</span>
            </div>
          </div>

          <button
            onClick={handleDownloadInvoice}
            disabled={downloading}
            className="flex items-center justify-center gap-2 border border-line rounded-lg py-2.5 text-sm font-medium text-ink-950/70 hover:bg-canvas transition-colors"
          >
            <Download size={15} />
            {downloading ? "Preparing…" : "Download invoice (PDF)"}
          </button>
        </div>
      </div>
    </div>
  );
}
