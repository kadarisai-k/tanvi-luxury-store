import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Truck } from "lucide-react";
import Layout from "../components/Layout";
import LoginModal from "../components/LoginModal";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { createRazorpayOrder, verifyPayment, createCodOrder, getMyOrders } from "../api/endpoints";
import { loadRazorpayScript } from "../utils/loadRazorpay";

const emptyAddress = { name: "", line1: "", line2: "", city: "", state: "", pincode: "", phone: "" };

export default function Checkout() {
  const { isAuthenticated, user } = useAuth();
  const { items, subtotal, gstTotal, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [loginOpen, setLoginOpen] = useState(false);
  const [address, setAddress] = useState({ ...emptyAddress, name: user?.name || "" });
  const [addressSaved, setAddressSaved] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null); // "cod" | "razorpay"
  const [paying, setPaying] = useState(false);
  const [placingCod, setPlacingCod] = useState(false);
  const [error, setError] = useState("");

  // Reuse the address from the customer's most recent order, if they have one.
  const [previousAddress, setPreviousAddress] = useState(null);
  const [addressMode, setAddressMode] = useState("form"); // "saved" | "form"

  // The empty-cart guard below (`if (items.length === 0) return <Navigate .../>`)
  // exists to stop someone visiting /checkout with nothing in their bag. But
  // clearCart() also empties the bag right after a successful order, on the
  // same page, a split second before we navigate away - which could otherwise
  // flash this same guard and bounce the user to /cart instead of onward.
  // This ref flags "an order was just placed" so that guard gets skipped.
  const orderJustPlacedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    getMyOrders()
      .then((orders) => {
        if (cancelled || !orders?.length) return;
        const lastAddress = orders[0].shippingAddress;
        if (!lastAddress) return;
        setPreviousAddress(lastAddress);
        setAddressMode("saved");
        setAddress(lastAddress);
      })
      .catch(() => {
        // No previous address available - just fall back to the blank form.
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (items.length === 0 && !orderJustPlacedRef.current) return <Navigate to="/cart" replace />;

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Phone and pincode are digits-only, capped to their real-world length -
    // this is UI-side convenience only; the backend re-validates independently.
    if (name === "phone") {
      return setAddress((a) => ({ ...a, phone: value.replace(/\D/g, "").slice(0, 10) }));
    }
    if (name === "pincode") {
      return setAddress((a) => ({ ...a, pincode: value.replace(/\D/g, "").slice(0, 6) }));
    }
    setAddress((a) => ({ ...a, [name]: value }));
  };

  const handleUseSavedAddress = () => {
    setAddress(previousAddress);
    setAddressSaved(true);
  };

  const handleSwitchAddressMode = (mode) => {
    setAddressMode(mode);
    if (mode === "saved") {
      setAddress(previousAddress);
    } else {
      setAddress({ ...emptyAddress, name: user?.name || "" });
    }
    setAddressError("");
  };

  const handleSubmitAddress = (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(address.phone)) {
      setAddressError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (!/^\d{6}$/.test(address.pincode)) {
      setAddressError("Enter a valid 6-digit pincode.");
      return;
    }
    setAddressError("");
    setAddressSaved(true);
  };

  const handlePlaceCodOrder = async () => {
    setError("");
    setPlacingCod(true);
    try {
      const order = await createCodOrder(address);
      orderJustPlacedRef.current = true;
      clearCart();
      navigate("/", { state: { orderPlaced: true, orderNumber: order.orderNumber } });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong placing your order. Please try again.");
    } finally {
      setPlacingCod(false);
    }
  };

  const handlePay = async () => {
    setError("");
    setPaying(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Couldn't load the payment gateway. Check your connection and try again.");
      }

      // Server recalculates the total from the DB cart - the amount here is only
      // for display, never trusted as the actual charge amount.
      const { razorpayOrderId, amount, currency, keyId } = await createRazorpayOrder(address);

      const razorpay = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: "Sri Tanvi Enterprises",
        description: "Order payment",
        prefill: {
          name: address.name,
          email: user?.email,
          contact: address.phone,
        },
        theme: { color: "#161311" },
        handler: async (response) => {
          try {
            const order = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              shippingAddress: address,
            });
            orderJustPlacedRef.current = true;
            clearCart();
            navigate("/", { state: { orderPlaced: true, orderNumber: order.orderNumber } });
          } catch (err) {
            setError(
              err.response?.data?.message ||
                "Payment succeeded but we couldn't confirm your order. Please contact us with your payment ID."
            );
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });

      razorpay.on("payment.failed", () => {
        setError("Payment failed or was cancelled. Please try again.");
        setPaying(false);
      });

      razorpay.open();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong. Please try again.");
      setPaying(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-14 grid grid-cols-1 lg:grid-cols-[1.4fr,1fr] gap-12">
        <div>
          <span className="eyebrow">Checkout</span>
          <h1 className="font-display text-3xl text-ink mt-2 mb-8">Shipping details</h1>

          {!isAuthenticated ? (
            <div className="border border-line px-7 py-8 text-center">
              <p className="text-ink mb-1 font-medium">Sign in to continue</p>
              <p className="text-sm text-muted mb-6">
                We'll email you a one-time code — no password needed.
              </p>
              <button
                onClick={() => setLoginOpen(true)}
                className="bg-ink text-cream text-sm font-medium px-7 py-3 hover:bg-ink/90 transition-colors"
              >
                Sign in with email
              </button>
            </div>
          ) : (
            <>
              {!addressSaved && previousAddress && (
                <label className="flex items-center gap-2.5 text-sm text-ink mb-5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addressMode === "saved"}
                    onChange={(e) => handleSwitchAddressMode(e.target.checked ? "saved" : "form")}
                    className="accent-ink"
                  />
                  I've ordered before — use my previous delivery address
                </label>
              )}

              {!addressSaved && addressMode === "saved" && previousAddress ? (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-muted -mt-2">
                    Signed in as <span className="text-ink">{user?.email}</span>
                  </p>
                  <div className="border border-line px-5 py-4 text-sm text-ink/80">
                    <div className="text-ink font-medium mb-1">{previousAddress.name}</div>
                    {previousAddress.line1} {previousAddress.line2}
                    <br />
                    {previousAddress.city}, {previousAddress.state} - {previousAddress.pincode}
                    <br />
                    Phone: {previousAddress.phone}
                  </div>
                  <button
                    onClick={handleUseSavedAddress}
                    className="bg-ink text-cream text-sm font-medium py-3.5 hover:bg-ink/90 transition-colors"
                  >
                    Deliver here & continue
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitAddress} className="flex flex-col gap-4">
                  <p className="text-sm text-muted -mt-2">
                    Signed in as <span className="text-ink">{user?.email}</span>
                  </p>

                  <Field label="Full name" name="name" value={address.name} onChange={handleChange} required disabled={addressSaved} />
                  <Field label="Address line 1" name="line1" value={address.line1} onChange={handleChange} required disabled={addressSaved} />
                  <Field label="Address line 2 (optional)" name="line2" value={address.line2} onChange={handleChange} disabled={addressSaved} />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="City" name="city" value={address.city} onChange={handleChange} required disabled={addressSaved} />
                    <Field label="State" name="state" value={address.state} onChange={handleChange} required disabled={addressSaved} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Pincode"
                      name="pincode"
                      value={address.pincode}
                      onChange={handleChange}
                      required
                      disabled={addressSaved}
                      inputMode="numeric"
                      maxLength={6}
                    />
                    <Field
                      label="Phone"
                      name="phone"
                      value={address.phone}
                      onChange={handleChange}
                      required
                      disabled={addressSaved}
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                    />
                  </div>

                  {!addressSaved && addressError && (
                    <div className="border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
                      {addressError}
                    </div>
                  )}

                  {!addressSaved && (
                    <button
                      type="submit"
                      className="mt-3 bg-ink text-cream text-sm font-medium py-3.5 hover:bg-ink/90 transition-colors"
                    >
                      Save address & continue
                    </button>
                  )}
                </form>
              )}

              {addressSaved && (
                <div className="mt-6 pt-6 border-t border-line">
                  <button
                    onClick={() => {
                      setAddressSaved(false);
                      setPaymentMethod(null);
                    }}
                    className="text-xs text-muted hover:text-ink mb-4"
                  >
                    Edit address
                  </button>

                  {error && (
                    <div className="mb-4 border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
                      {error}
                    </div>
                  )}

                  <p className="text-sm text-ink font-medium mb-3">Payment method</p>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("razorpay")}
                      className={`border px-4 py-3.5 text-sm font-medium text-left transition-colors ${
                        paymentMethod === "razorpay" ? "border-ink bg-ink text-cream" : "border-line text-ink hover:border-ink"
                      }`}
                    >
                      <Lock size={15} className="mb-1.5" />
                      <div>Pay online</div>
                      <div className={`text-xs font-normal ${paymentMethod === "razorpay" ? "text-cream/70" : "text-muted"}`}>
                        UPI, cards, netbanking
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`border px-4 py-3.5 text-sm font-medium text-left transition-colors ${
                        paymentMethod === "cod" ? "border-ink bg-ink text-cream" : "border-line text-ink hover:border-ink"
                      }`}
                    >
                      <Truck size={15} className="mb-1.5" />
                      <div>Cash on Delivery</div>
                      <div className={`text-xs font-normal ${paymentMethod === "cod" ? "text-cream/70" : "text-muted"}`}>
                        Pay when it arrives
                      </div>
                    </button>
                  </div>

                  {paymentMethod === "razorpay" && (
                    <>
                      <button
                        onClick={handlePay}
                        disabled={paying}
                        className="w-full flex items-center justify-center gap-2 bg-ink text-cream text-sm font-medium py-4 disabled:opacity-60 hover:bg-ink/90 transition-colors"
                      >
                        <Lock size={15} />
                        {paying ? "Opening payment…" : `Pay ₹${total.toLocaleString("en-IN")} securely`}
                      </button>
                      <p className="text-xs text-muted text-center mt-3">
                        Powered by Razorpay — UPI, cards, netbanking & wallets accepted.
                      </p>
                    </>
                  )}

                  {paymentMethod === "cod" && (
                    <>
                      <button
                        onClick={handlePlaceCodOrder}
                        disabled={placingCod}
                        className="w-full flex items-center justify-center gap-2 bg-ink text-cream text-sm font-medium py-4 disabled:opacity-60 hover:bg-ink/90 transition-colors"
                      >
                        <Truck size={15} />
                        {placingCod ? "Placing order…" : `Place order — Pay ₹${total.toLocaleString("en-IN")} on delivery`}
                      </button>
                      <p className="text-xs text-muted text-center mt-3">
                        Please keep the exact amount ready for the delivery agent.
                      </p>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Order summary */}
        <div className="bg-line/30 p-7 h-fit">
          <h2 className="font-display text-xl text-ink mb-5">Order summary</h2>
          <div className="flex flex-col gap-3 mb-5">
            {items.map(({ _id, product, quantity, photoShareMethod, sizeLabel, sizePrice }) => (
              <div key={_id} className="flex justify-between text-sm">
                <span className="text-ink/80">
                  {product.title} × {quantity}
                  {sizeLabel && <span className="text-muted"> ({sizeLabel})</span>}
                  {photoShareMethod === "drive" && <span className="text-gold-600"> · photos linked</span>}
                  {photoShareMethod === "whatsapp" && <span className="text-gold-600"> · photos via WhatsApp</span>}
                </span>
                <span className="text-ink">₹{((sizePrice ?? product.price) * quantity).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-line pt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-ink/70">
              <span>Items Total</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {gstTotal > 0 && (
              <div className="flex justify-between text-ink/70">
                <span>GST</span>
                <span>₹{gstTotal.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-ink/70">
              <span>Delivery Fee</span>
              <span>Free</span>
            </div>
          </div>
          <div className="border-t border-line mt-3 pt-4 flex justify-between text-base font-medium text-ink">
            <span>To Pay</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>
          <Link to="/cart" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink mt-4">
            Edit bag <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </Layout>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="text-sm text-muted">{label}</label>
      <input
        {...props}
        className="mt-1.5 w-full border-b border-line bg-transparent py-2 text-sm outline-none focus:border-ink disabled:text-muted disabled:cursor-not-allowed"
      />
    </div>
  );
}
