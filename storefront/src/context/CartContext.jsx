import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import {
  getServerCart,
  syncCart,
  addToServerCart,
  updateServerCartItem,
  removeFromServerCart,
} from "../api/endpoints";

const CartContext = createContext(null);
const STORAGE_KEY = "tanvi_guest_cart"; // [{ _id, product: {...snapshot}, quantity, driveLink }] - guests only

// Categories where a customer must attach a Google Drive photo link - kept in
// sync with backend/src/controllers/cartController.js#CUSTOM_PHOTO_CATEGORIES.
export const CUSTOM_PHOTO_CATEGORIES = ["photo_frames", "photo_albums"];

function makeLocalItemId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function readLocalCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState(readLocalCart);
  const wasAuthenticated = useRef(false);

  // Guests: mirror every change to localStorage.
  useEffect(() => {
    if (!isAuthenticated) writeLocalCart(items);
  }, [items, isAuthenticated]);

  // Whenever the user is (or becomes) authenticated, the server cart is the
  // source of truth. On the login transition specifically, push whatever was
  // sitting in the guest cart up to the server first (merging, not
  // overwriting, anything already saved there), then load the result. This
  // also runs harmlessly on mount if a session already existed (e.g. page
  // refresh while logged in) - the guest cart is empty by then, so it's just
  // a plain fetch.
  useEffect(() => {
    if (!isAuthenticated) {
      if (wasAuthenticated.current) {
        // Just logged out - back to a clean guest cart.
        setItems([]);
        writeLocalCart([]);
      }
      wasAuthenticated.current = false;
      return;
    }

    wasAuthenticated.current = true;
    let cancelled = false;

    (async () => {
      try {
        const guestItems = readLocalCart();
        const cart = guestItems.length
          ? await syncCart(
              guestItems.map((i) => ({
                productId: i.product._id,
                quantity: i.quantity,
                driveLink: i.driveLink || "",
                photoShareMethod: i.photoShareMethod || "",
                sizeLabel: i.sizeLabel || "",
              }))
            )
          : await getServerCart();
        if (!cancelled) setItems(cart.items || []);
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // offline or request failed - leave items as-is; the next cart
        // action (or a refresh) will retry against the server.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Adds a product to the bag. Photo-share choices (Drive link / WhatsApp)
  // are made afterwards from the Cart page, so a fresh add always starts
  // clean; two additions of the same product merge into one line as long as
  // neither already has a photo-share choice attached (see updatePhotoShare).
  const addItem = useCallback(
    async (product, quantity = 1, sizeLabel = "") => {
      if (isAuthenticated) {
        try {
          const cart = await addToServerCart(product._id, quantity, sizeLabel);
          setItems(cart.items || []);
          return { success: true };
        } catch (err) {
          // Previously this was a silent no-op: the request could fail (session
          // expired, network error, out of stock, etc.) while the button still
          // showed "Added to bag", so the item looked added but never was.
          return {
            success: false,
            error: err.response?.data?.message || "Couldn't add this to your bag. Please try again.",
          };
        }
      }
      // Guests: resolve the size locally the same way the backend would, so
      // the locked-in price shown in the bag matches what the server will
      // charge once this cart is synced up after login.
      const variant = product.sizeVariants?.find((v) => v.label === sizeLabel);
      const sizePrice = variant ? variant.price : null;
      setItems((prev) => {
        const existing = prev.find(
          (i) =>
            i.product._id === product._id &&
            !i.photoShareMethod &&
            (i.sizeLabel || "") === (sizeLabel || "")
        );
        if (existing) {
          return prev.map((i) =>
            i._id === existing._id ? { ...i, quantity: i.quantity + quantity } : i
          );
        }
        return [
          ...prev,
          {
            _id: makeLocalItemId(),
            product,
            quantity,
            driveLink: "",
            photoShareMethod: "",
            sizeLabel: sizeLabel || "",
            sizePrice,
          },
        ];
      });
      return { success: true };
    },
    [isAuthenticated]
  );

  const updateQuantity = useCallback(
    async (itemId, quantity) => {
      if (isAuthenticated) {
        try {
          const cart = await updateServerCartItem(itemId, { quantity });
          setItems(cart.items || []);
          return { success: true };
        } catch (err) {
          return {
            success: false,
            error: err.response?.data?.message || "Couldn't update your bag. Please try again.",
          };
        }
      }
      setItems((prev) => {
        if (quantity <= 0) return prev.filter((i) => i._id !== itemId);
        return prev.map((i) => (i._id === itemId ? { ...i, quantity } : i));
      });
      return { success: true };
    },
    [isAuthenticated]
  );

  // Lets the customer set or change how they'll share photos for this line
  // item: paste a Drive link in-app, or hand it off to WhatsApp instead.
  // Called from Cart.jsx's "Add Photos" action.
  const updatePhotoShare = useCallback(
    async (itemId, { driveLink, photoShareMethod }) => {
      if (isAuthenticated) {
        try {
          const cart = await updateServerCartItem(itemId, { driveLink, photoShareMethod });
          setItems(cart.items || []);
          return { success: true };
        } catch (err) {
          return {
            success: false,
            error: err.response?.data?.message || "Couldn't save that. Please try again.",
          };
        }
      }
      setItems((prev) =>
        prev.map((i) =>
          i._id === itemId
            ? {
                ...i,
                driveLink: photoShareMethod === "drive" ? driveLink || "" : "",
                photoShareMethod: photoShareMethod || "",
              }
            : i
        )
      );
      return { success: true };
    },
    [isAuthenticated]
  );

  const removeItem = useCallback(
    async (itemId) => {
      if (isAuthenticated) {
        try {
          const cart = await removeFromServerCart(itemId);
          setItems(cart.items || []);
          return { success: true };
        } catch (err) {
          return {
            success: false,
            error: err.response?.data?.message || "Couldn't remove this item. Please try again.",
          };
        }
      }
      setItems((prev) => prev.filter((i) => i._id !== itemId));
      return { success: true };
    },
    [isAuthenticated]
  );

  // Called right after a successful order. The order controller already
  // clears the cart server-side, so this just mirrors that in the UI.
  const clearCart = useCallback(() => {
    setItems([]);
    if (!isAuthenticated) writeLocalCart([]);
  }, [isAuthenticated]);

  const subtotal = items.reduce((sum, i) => sum + (i.sizePrice ?? i.product.price) * i.quantity, 0);
  // GST is calculated per item from its category's rate (set in the admin panel).
  // This is a display estimate only - the backend always recalculates and is
  // the source of truth for the amount actually charged.
  const gstTotal = items.reduce((sum, i) => {
    const gstPercent = i.product.category?.gstPercent || 0;
    const price = i.sizePrice ?? i.product.price;
    return sum + Math.round((price * i.quantity * gstPercent) / 100);
  }, 0);
  const total = subtotal + gstTotal;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        updatePhotoShare,
        removeItem,
        clearCart,
        subtotal,
        gstTotal,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
