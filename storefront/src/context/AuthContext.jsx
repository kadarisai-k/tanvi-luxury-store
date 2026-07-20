import { createContext, useContext, useState } from "react";
import { verifyOtp as apiVerifyOtp, sendOtp as apiSendOtp, logoutCustomer } from "../api/endpoints";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("customerUser");
    return stored ? JSON.parse(stored) : null;
  });

  const requestOtp = async (email) => apiSendOtp(email);

  // Cart syncing (guest -> server) happens in CartContext, which reacts to
  // isAuthenticated flipping true - keeps this context focused on auth only.
  const confirmOtp = async (email, otp, name) => {
    const data = await apiVerifyOtp(email, otp, name);
    localStorage.setItem("customerToken", data.token);
    localStorage.setItem("customerUser", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await logoutCustomer();
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerUser");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, requestOtp, confirmOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
