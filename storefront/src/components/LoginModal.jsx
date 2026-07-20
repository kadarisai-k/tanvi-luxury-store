import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginModal({ onClose, onSuccess }) {
  const { requestOtp, confirmOtp } = useAuth();

  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestOtp(email);
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // CartContext reacts to isAuthenticated flipping true and syncs the
      // guest bag to the server itself - nothing cart-related needed here.
      await confirmOtp(email, otp, name);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Incorrect or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await requestOtp(email);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't resend code.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4">
      <div className="bg-cream w-full max-w-sm p-8 relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-ink/50 hover:text-ink">
          <X size={18} />
        </button>

        <span className="eyebrow">Sign In</span>
        <h2 className="font-display text-2xl text-ink mt-2 mb-6">
          {step === "email" ? "Enter your email" : "Enter the code"}
        </h2>

        {step === "email" && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-muted">Email address</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full border-b border-line bg-transparent py-2 text-sm outline-none focus:border-ink"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm text-muted">Name (optional)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full border-b border-line bg-transparent py-2 text-sm outline-none focus:border-ink"
                placeholder="For your first order"
              />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-ink text-cream text-sm font-medium py-3.5 disabled:opacity-50 hover:bg-ink/90 transition-colors"
            >
              {loading ? "Sending…" : "Send code"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <p className="text-sm text-muted -mt-2">
              We sent a 6-digit code to <span className="text-ink">{email}</span>
            </p>
            <input
              type="text"
              required
              autoFocus
              maxLength={6}
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full border-b border-line bg-transparent py-2 text-2xl tracking-[0.3em] text-center outline-none focus:border-ink"
              placeholder="000000"
            />

            {error && <div className="text-sm text-red-600">{error}</div>}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="mt-2 bg-ink text-cream text-sm font-medium py-3.5 disabled:opacity-50 hover:bg-ink/90 transition-colors"
            >
              {loading ? "Verifying…" : "Verify & continue"}
            </button>

            <div className="flex justify-between text-xs text-muted">
              <button type="button" onClick={() => setStep("email")} className="hover:text-ink">
                Change email
              </button>
              <button type="button" onClick={handleResend} className="hover:text-ink">
                Resend code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
