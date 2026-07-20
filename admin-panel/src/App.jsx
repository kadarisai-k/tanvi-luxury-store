import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProductsCategory from "./pages/ProductsCategory";
import Orders from "./pages/Orders";
import HomePageEdits from "./pages/HomePageEdits";
import GstSettings from "./pages/GstSettings";

export default function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:categorySlug"
            element={
              <ProtectedRoute>
                <ProductsCategory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home-page-edits"
            element={
              <ProtectedRoute>
                <HomePageEdits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/gst"
            element={
              <ProtectedRoute>
                <GstSettings />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}
