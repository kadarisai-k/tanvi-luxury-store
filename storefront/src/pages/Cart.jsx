import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  X,
  ArrowRight,
  FolderInput,
  Pencil,
  Check,
  MessageCircle,
  ImagePlus,
  ImageOff,
} from "lucide-react";
import Layout from "../components/Layout";
import { useCart, CUSTOM_PHOTO_CATEGORIES } from "../context/CartContext";
import { STORE_WHATSAPP_NUMBER } from "../constants/contact";

const DRIVE_LINK_PATTERN = /^https:\/\/(drive|photos)\.google\.com\//i;

function buildWhatsappUrl(productTitle) {
  const message =
    `Hi! I've selected "${productTitle}" from Sri Tanvi Enterprises and would like to share the ` +
    `Google Drive link to my photos for printing & framing.\n\nHere's my Drive link: `;
  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// The "Add Photos" control for a single cart line. Three states:
//  1. Nothing chosen yet -> a single "Add Photos" button.
//  2. Button clicked -> two options: WhatsApp or paste a Drive link.
//  3. A choice has been made -> a status chip, with a way to change it.
function AddPhotosControl({ item, product, forceOpen, onForceOpenHandled }) {
  const { updatePhotoShare } = useCart();
  const [choosing, setChoosing] = useState(false);
  const [pastingLink, setPastingLink] = useState(false);
  const [linkValue, setLinkValue] = useState(item.driveLink || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Lets a parent (the "add photos before checkout?" prompt) jump straight
  // to this item's chooser instead of the user hunting for it themselves.
  useEffect(() => {
    if (forceOpen) {
      setChoosing(true);
      onForceOpenHandled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceOpen]);

  const reset = () => {
    setChoosing(false);
    setPastingLink(false);
    setError("");
  };

  const handleWhatsapp = async () => {
    window.open(buildWhatsappUrl(product.title), "_blank", "noopener,noreferrer");
    setSaving(true);
    await updatePhotoShare(item._id, { photoShareMethod: "whatsapp", driveLink: "" });
    setSaving(false);
    reset();
  };

  const handleSaveLink = async () => {
    const trimmed = linkValue.trim();
    if (!DRIVE_LINK_PATTERN.test(trimmed)) {
      setError("That doesn't look like a Google Drive link.");
      return;
    }
    setSaving(true);
    const result = await updatePhotoShare(item._id, { photoShareMethod: "drive", driveLink: trimmed });
    setSaving(false);
    if (result.success) {
      reset();
    } else {
      setError(result.error);
    }
  };

  // State 3: already chosen - show a status chip with an edit affordance.
  if (!choosing && item.photoShareMethod === "drive" && item.driveLink) {
    return (
      <div className="flex items-center gap-1.5 mt-1.5">
        <FolderInput size={12} className="text-gold-600 shrink-0" />
        <a
          href={item.driveLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gold-600 underline truncate max-w-[200px]"
        >
          Your photos link
        </a>
        <button onClick={() => { setPastingLink(true); setChoosing(true); }} className="text-muted hover:text-ink shrink-0" aria-label="Edit Drive link">
          <Pencil size={11} />
        </button>
      </div>
    );
  }
  if (!choosing && item.photoShareMethod === "whatsapp") {
    return (
      <div className="flex items-center gap-1.5 mt-1.5">
        <MessageCircle size={12} className="text-gold-600 shrink-0" />
        <span className="text-xs text-gold-600">Sharing photos via WhatsApp</span>
        <button onClick={() => setChoosing(true)} className="text-muted hover:text-ink shrink-0" aria-label="Change how you share photos">
          <Pencil size={11} />
        </button>
      </div>
    );
  }

  // State 2a: chooser open, but not yet on the "paste link" sub-step.
  if (choosing && !pastingLink) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          onClick={handleWhatsapp}
          disabled={saving}
          className="flex items-center gap-1.5 border border-line px-2.5 py-1.5 text-xs font-medium text-ink hover:border-ink transition-colors"
        >
          <MessageCircle size={12} /> Share via WhatsApp
        </button>
        <button
          onClick={() => setPastingLink(true)}
          className="flex items-center gap-1.5 border border-line px-2.5 py-1.5 text-xs font-medium text-ink hover:border-ink transition-colors"
        >
          <FolderInput size={12} /> Paste Drive link
        </button>
        <button onClick={reset} className="text-xs text-muted hover:text-ink">
          Cancel
        </button>
      </div>
    );
  }

  // State 2b: pasting a Drive link.
  if (choosing && pastingLink) {
    return (
      <div className="mt-2 w-full max-w-xs">
        <div className="flex items-center gap-2">
          <input
            type="url"
            autoFocus
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="flex-1 min-w-0 border border-line px-2.5 py-1.5 text-xs bg-transparent focus:outline-none focus:border-ink"
          />
          <button onClick={handleSaveLink} disabled={saving} className="text-ink hover:text-gold-600 shrink-0" aria-label="Save Drive link">
            <Check size={15} />
          </button>
          <button onClick={reset} className="text-muted hover:text-red-600 shrink-0" aria-label="Cancel">
            <X size={15} />
          </button>
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    );
  }

  // State 1: nothing chosen yet.
  return (
    <button
      onClick={() => setChoosing(true)}
      className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-gold-600 hover:text-gold-700"
    >
      <ImagePlus size={13} /> Add Photos
    </button>
  );
}

// Shown when the customer hits "Proceed to Checkout" while one or more bag
// items still have no photo attached (no Drive link, nothing sent over
// WhatsApp). Gives them an explicit, informed choice instead of silently
// checking out with a blank frame.
function PhotoPromptModal({ missingItems, onContinueWithoutPhotos, onUploadPhotos, onClose }) {
  const names = missingItems.map((i) => i.product.title).join(", ");
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-cream border border-line p-6 shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-ink"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="w-10 h-10 rounded-full bg-gold-600/10 flex items-center justify-center mb-4">
          <ImagePlus size={18} className="text-gold-600" />
        </div>

        <h2 className="font-display text-xl text-ink mb-2">Add your photos?</h2>
        <p className="text-sm text-muted mb-6">
          You haven't added photos yet for{" "}
          <span className="text-ink font-medium">{names}</span>. You can continue and
          we'll prepare just the frame, or add your photos now so we can print the
          complete photo frame.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onUploadPhotos}
            className="flex items-center justify-center gap-2 bg-ink text-cream text-sm font-medium py-3 hover:bg-ink/90 transition-colors"
          >
            <ImagePlus size={15} /> Upload Photos Now
          </button>
          <button
            onClick={onContinueWithoutPhotos}
            className="flex items-center justify-center gap-2 border border-line text-ink text-sm font-medium py-3 hover:border-ink transition-colors"
          >
            <ImageOff size={15} /> Continue Without Photos (Frame Only)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal, gstTotal, total } = useCart();
  const navigate = useNavigate();
  const itemRefs = useRef({});
  const [showPhotoPrompt, setShowPhotoPrompt] = useState(false);
  const [activePhotoItemId, setActivePhotoItemId] = useState(null);

  // Only Photo Frames & Photo Albums actually get customer photos printed
  // into them - other categories don't need this at all.
  const missingPhotoItems = items.filter(
    (i) => CUSTOM_PHOTO_CATEGORIES.includes(i.product.category?.slug) && !i.photoShareMethod
  );

  const handleProceedClick = () => {
    if (missingPhotoItems.length > 0) {
      setShowPhotoPrompt(true);
      return;
    }
    navigate("/checkout");
  };

  const handleContinueWithoutPhotos = () => {
    setShowPhotoPrompt(false);
    navigate("/checkout");
  };

  const handleUploadPhotosInstead = () => {
    setShowPhotoPrompt(false);
    const firstId = missingPhotoItems[0]?._id;
    if (!firstId) return;
    setActivePhotoItemId(firstId);
    requestAnimationFrame(() => {
      itemRefs.current[firstId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h1 className="font-display text-3xl text-ink mb-3">Your bag is empty</h1>
          <p className="text-muted mb-8">Discover something you'll love.</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-ink text-cream text-sm font-medium px-7 py-3.5 hover:bg-ink/90 transition-colors"
          >
            Continue Shopping <ArrowRight size={15} />
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-14">
        <h1 className="font-display text-4xl text-ink mb-10">Your Bag</h1>

        <div className="divide-y divide-line border-y border-line">
          {items.map((item) => {
            const { product, quantity, _id, sizeLabel, sizePrice } = item;
            const effectivePrice = sizePrice ?? product.price;
            const isCustomPhoto = CUSTOM_PHOTO_CATEGORIES.includes(product.category?.slug);
            return (
              <div
                key={_id}
                ref={(el) => (itemRefs.current[_id] = el)}
                className="flex flex-wrap sm:flex-nowrap items-start gap-4 sm:gap-5 py-6"
              >
                <img
                  src={product.images?.[0]?.url}
                  alt={product.title}
                  className="w-20 h-20 object-cover bg-line shrink-0"
                />
                <div className="flex-1 min-w-[140px]">
                  <h3 className="font-display text-lg text-ink truncate">{product.title}</h3>
                  {sizeLabel && <p className="text-xs text-muted mt-0.5">Size: {sizeLabel}</p>}
                  <p className="text-sm text-muted mt-1">₹{effectivePrice?.toLocaleString("en-IN")}</p>
                  {isCustomPhoto && (
                    <AddPhotosControl
                      item={item}
                      product={product}
                      forceOpen={activePhotoItemId === _id}
                      onForceOpenHandled={() => setActivePhotoItemId(null)}
                    />
                  )}
                </div>

                <div className="flex items-center gap-4 sm:gap-5 ml-auto sm:ml-0">
                  <div className="flex items-center border border-line shrink-0">
                    <button
                      onClick={() => updateQuantity(_id, quantity - 1)}
                      className="p-2.5 text-ink hover:text-gold-500"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-7 text-center text-sm">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(_id, quantity + 1)}
                      className="p-2.5 text-ink hover:text-gold-500"
                      aria-label="Increase quantity"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <div className="w-16 sm:w-20 text-right text-sm font-medium text-ink shrink-0">
                    ₹{(effectivePrice * quantity).toLocaleString("en-IN")}
                  </div>
                  <button
                    onClick={() => removeItem(_id)}
                    className="text-muted hover:text-red-600 shrink-0"
                    aria-label="Remove from bag"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end mt-8">
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-sm text-muted mb-2">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {gstTotal > 0 && (
              <div className="flex justify-between text-sm text-muted mb-2">
                <span>GST</span>
                <span>₹{gstTotal.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-medium text-ink mb-6">
              <span>Total</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>
            <button
              onClick={handleProceedClick}
              className="flex items-center justify-center gap-2 w-full bg-ink text-cream text-sm font-medium py-3.5 hover:bg-ink/90 transition-colors"
            >
              Proceed to Checkout <ArrowRight size={15} />
            </button>
            <p className="text-xs text-muted text-center mt-3">
              You'll verify your email with a one-time code at checkout.
            </p>
          </div>
        </div>
      </div>

      {showPhotoPrompt && (
        <PhotoPromptModal
          missingItems={missingPhotoItems}
          onContinueWithoutPhotos={handleContinueWithoutPhotos}
          onUploadPhotos={handleUploadPhotosInstead}
          onClose={() => setShowPhotoPrompt(false)}
        />
      )}
    </Layout>
  );
}
