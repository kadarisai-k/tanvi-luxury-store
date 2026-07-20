# Sri Tanvi Enterprises — Storefront (Phase 3)

React + Vite + Tailwind customer-facing storefront, built to match the reference design
(the "Sri Tanvi Enterprises" preview screenshots) exactly — same fonts, colors, layout,
and copy.

## Design system (matched from the reference screenshots)

- **Fonts**: Playfair Display (serif, for all headings/logo — with italic used for
  "Enterprises" in the logo and testimonial quotes) + Inter (sans-serif, for nav, body,
  and all uppercase tracked labels like "EST. HYDERABAD", "SORT", nav links)
- **Colors**: warm cream background (#FAF6F0), near-black ink for text/buttons
  (#161311), true black for feature/footer sections (#141414), muted antique gold
  accent (#B08D4F / #C9A96B) for eyebrows, icons, and hover states
- **Layout patterns replicated**: black announcement bar above a cream nav bar; split
  hero (text left / full-bleed image right); "eyebrow + serif heading" pattern repeated
  across every section; black 4-column icon feature strip; centered testimonials with
  quote-mark icons; 4-column black footer

## Pages built in this phase

- **Home** (/) — Hero, "Shop by Story" category grid, "Featured Pieces", "Best
  Sellers", "Why Sri Tanvi" (4 features on black), "Loved by our patrons" testimonials
- **Category listing** (/shop, /shop/kitchen, /shop/jewellery, /shop/photo_frames,
  /shop/photo_albums) — matches the "Kitchen Products" reference screenshot exactly:
  eyebrow + heading, search + sort bar, product grid, "No products found." empty state
- **Product detail** (/product/:slug) — image gallery, price/MRP/discount, attributes,
  quantity selector, Add to Bag
- **Cart** (/cart) — guest cart (localStorage-backed via CartContext), quantity
  edit/remove, subtotal, "Proceed to Checkout"
- **Login** — email OTP modal (`LoginModal`), two-step (email → 6-digit code), triggered
  from the header account icon, the Account page, or Checkout. On success, any guest
  cart items are synced to the server via `POST /api/cart/sync` and the local guest
  cart is cleared.
- **Header** — shows a plain account icon when logged out; once logged in, shows the
  user's initial in a circle with a dropdown (My Orders / Log out)
- **Account page** (/account) — sign-in prompt if logged out; once logged in, shows
  profile + full order history with status badges
- **Checkout page** (/checkout) — requires login (shows the same OTP modal inline if
  not signed in), collects a shipping address, then a "Pay securely" button opens the
  real **Razorpay Checkout modal** (order created server-side via
  `POST /api/orders/create-razorpay-order`, amount always recalculated from the DB
  cart - never trusted from the client). On success, the payment signature is verified
  server-side (`POST /api/orders/verify-payment`), the order is created, stock is
  decremented, a confirmation email goes out, and the customer lands on the order
  confirmation page. Payment failures/cancellations show an inline error and let the
  customer retry.
- **Order confirmation page** (/order-confirmation/:orderId) — order number, items,
  total, shipping address, links to "View my orders" or "Continue shopping"
- **Placeholder** for unmatched routes (404) only now — /account and /checkout are fully built.

## Setup

```bash
cd storefront
npm install
cp .env.example .env      # set VITE_API_URL to your backend's URL
npm run dev                # http://localhost:5173 (or whichever port Vite picks)
```

## Verified
npm run build completes with zero errors. Could not render a live visual screenshot
in this environment (headless browser download is blocked by network restrictions
here), so fidelity to the reference was verified by careful line-by-line comparison
against each provided screenshot instead - recommend you run npm run dev and compare
side-by-side with the reference once you have it locally.

## Next
Storefront is now feature-complete for a v1 launch (browse → cart → OTP login → pay →
confirmation → order history). Remaining work is largely non-UI: wiring real
credentials (MongoDB/Cloudinary/Razorpay/Brevo), responsive/empty-state polish pass,
and deployment. See the root PROJECT-SPEC.md for the full remaining checklist.
