import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import Layout from "../components/Layout";
import { getMyOrderById } from "../api/endpoints";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyOrderById(orderId)
      .then(setOrder)
      .catch(() => setError("Couldn't load this order."))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-6 lg:px-10 py-16">
        {loading && <div className="text-center text-muted py-16">Loading…</div>}

        {error && <div className="text-center text-red-600 py-16">{error}</div>}

        {order && (
          <>
            <div className="text-center mb-10">
              <CheckCircle2 size={44} className="mx-auto text-gold-500 mb-4" strokeWidth={1.3} />
              <span className="eyebrow">Order Confirmed</span>
              <h1 className="font-display text-3xl text-ink mt-2">Thank you, {order.shippingAddress?.name?.split(" ")[0] || "there"}.</h1>
              <p className="text-muted mt-2">
                Order <span className="text-ink font-medium">{order.orderNumber}</span> has
                been placed. A confirmation email is on its way.
              </p>
            </div>

            <div className="border border-line px-7 py-6">
              <h2 className="font-display text-lg text-ink mb-4">Order summary</h2>
              <div className="flex flex-col gap-2.5 mb-5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {item.image && (
                      <img src={item.image} alt="" className="w-12 h-12 object-cover bg-line shrink-0" />
                    )}
                    <div className="flex-1 min-w-0 text-sm">
                      <div className="text-ink truncate">{item.title}</div>
                      <div className="text-muted">Qty {item.quantity}</div>
                    </div>
                    <div className="text-sm text-ink shrink-0">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-line pt-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between text-ink/70">
                  <span>Items Total</span>
                  <span>₹{order.subtotal?.toLocaleString("en-IN")}</span>
                </div>
                {order.gstTotal > 0 && (
                  <div className="flex justify-between text-ink/70">
                    <span>GST</span>
                    <span>₹{order.gstTotal.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink/70">
                  <span>Delivery Fee</span>
                  <span>Free</span>
                </div>
              </div>

              <div className="border-t border-line mt-3 pt-4 flex justify-between text-base font-medium text-ink">
                <span>{order.paymentInfo?.method === "cod" ? "Amount due on delivery" : "Total paid"}</span>
                <span>₹{order.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
              {order.paymentInfo?.method === "cod" && (
                <p className="text-xs text-muted mt-2">
                  Please keep the exact amount ready for the delivery agent.
                </p>
              )}

              <div className="mt-6 pt-5 border-t border-line text-sm text-muted">
                <div className="text-ink font-medium mb-1">Shipping to</div>
                {order.shippingAddress?.name}, {order.shippingAddress?.line1}{" "}
                {order.shippingAddress?.line2}
                <br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
                {order.shippingAddress?.pincode}
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-10">
              <Link
                to="/account"
                className="border border-ink text-ink text-sm font-medium px-7 py-3 hover:bg-ink hover:text-cream transition-colors"
              >
                View my orders
              </Link>
              <Link
                to="/shop"
                className="bg-ink text-cream text-sm font-medium px-7 py-3 hover:bg-ink/90 transition-colors"
              >
                Continue shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
