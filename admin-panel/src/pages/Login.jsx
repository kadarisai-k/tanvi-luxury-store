import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function Login() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-display text-3xl font-semibold text-white tracking-tight">
            Tanvi
          </div>
          <div className="text-xs uppercase tracking-[0.16em] text-gold-400 font-medium mt-1">
            Luxury Store — Admin
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface rounded-xl2 shadow-card p-7 flex flex-col gap-4"
        >
          <div>
            <label className="text-sm font-medium text-ink-950/80">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-plum-600 outline-none"
              placeholder="admin@tanvistore.com"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink-950/80">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-plum-600 outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-plum-700 hover:bg-plum-800 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
