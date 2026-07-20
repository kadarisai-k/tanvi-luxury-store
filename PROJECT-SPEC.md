# Mini E-Commerce Platform — Project Specification
### (Kitchen / Jewellery / Photo Frames / Photo Albums Store)

**Stack:** React (frontend) + Node.js/Express (backend) + MongoDB (database) + Cloudinary (images) + Razorpay (payments)

> **This document is the single source of truth for the project.** Every time we make a
> decision or finish a phase, it gets recorded here so we can pick up exactly where we
> left off, even after a break of days/weeks. Scroll to **Section 0** for current status.

---

## 0. Current Status & Decisions Log (READ THIS FIRST)

### ✅ Where we've stopped
**Phase 1 (Backend) and Phase 2 (Admin Panel frontend) are both complete and verified.**

- Backend: built, installed, syntax-checked, boots cleanly. Also gained one addition
  during Phase 2: `GET /api/admin/dashboard/stats` (today's/month's orders, revenue,
  low-stock list, recent orders) to power the admin dashboard.
- Admin panel: React + Vite + Tailwind app, `npm run build` succeeds with zero errors.
  Login, Dashboard, per-category Product management (all 4 categories), and Orders
  (date-range filter, status updates, Excel/PDF export, invoice download) are all built.
  Not yet tested against a live backend with real MongoDB/Cloudinary/Razorpay/Brevo
  credentials — that happens once you fill in real `.env` values.

**Next up: Phase 3 is done too — see below.**

### ✅ Phase 3 update
**Storefront frontend built to match your actual reference design** (screenshots of the
"Sri Tanvi Enterprises" preview site you shared). Design system: Playfair Display
(serif headings/logo) + Inter (sans body/nav), warm cream background, near-black text,
muted antique gold accents, black feature/footer sections — matched section-by-section
from your screenshots (hero, "Shop by Story" categories, "Featured Pieces", "Best
Sellers", "Why Sri Tanvi" 4-feature strip, testimonials with your actual quotes, footer
with your actual contact info). `npm run build` passes with zero errors. Note: couldn't
render a live screenshot to visually diff against the reference in this environment
(headless browser download blocked by network restrictions here) — verified by careful
manual comparison against each screenshot instead; worth a side-by-side check once you
run it locally.

**Next up: Phase 9 — YOU set up real accounts (guide is ready: see `SETUP-GUIDE.md` at the project root), then Phase 10 — deployment.**

### Phase 9 note
Phase 9 is the one phase that genuinely requires you, not me — creating accounts with
MongoDB Atlas, Cloudinary, Razorpay, and Brevo needs your own login/signup/business
details (and Razorpay needs KYC verification before going live, which only you can
complete). Full step-by-step is in `SETUP-GUIDE.md`.

**Credential checklist (values live in `backend/.env`, not repeated here for security):**
- [x] MongoDB Atlas — cluster + db user created, connection string in `.env`
- [x] Cloudinary — cloud name + API key + API secret all in `.env`
- [x] Razorpay — test mode key ID + secret in `.env`
- [ ] Razorpay — webhook secret (set this up after deployment, not needed for local testing)
- [x] JWT secrets — generated and in `.env` (mapped to `JWT_SECRET`/`ADMIN_JWT_SECRET`;
      note our backend doesn't implement a separate refresh-token flow, so the
      refresh secret you generated isn't used yet — flag if you want that built)
- [x] Brevo — SMTP login in `.env` (this is Brevo's auto-generated login like
      `xxxxx@smtp-brevo.com`, not your account email — corrected in SETUP-GUIDE.md)
- [x] Brevo — SMTP password in `.env` — **verified working** via `backend/test-smtp.js`
      (first key had an auth error, likely a misread character from a screenshot;
      regenerated key confirmed working with a real test send)
- [ ] Admin email/password — currently a placeholder in `.env`, needs to be set to
      real values before running `npm run seed`

Once every box above is checked, run `npm run seed` then `npm run dev` in `backend/`
and test the full flow locally per `SETUP-GUIDE.md` section 7.

### Phase 8 update
**Polish pass done on the storefront**, plus a couple of quick admin-panel fixes:
- Fixed a real bug: the header search button was completely invisible on mobile (had
  `hidden sm:flex` with no fallback) — added an icon-only mobile search button
- Cart page rows now stack sensibly on small screens instead of cramming into one row
- Product grids (Home + Shop) now show skeleton loaders while fetching instead of
  plain "Loading…" text, and show a real error message (not a misleading "no
  products found") if the API call fails
- Shop page search is now debounced (350ms) instead of firing a request per keystroke
- Added a global error boundary so an unexpected render crash shows a friendly
  "refresh the page" screen instead of a blank white page
- Added scroll-to-top on route change (React Router doesn't do this by default)
- Admin panel: product/order tables now scroll horizontally on narrow viewports
  instead of squishing illegibly (the admin panel remains desktop-oriented overall —
  a full mobile-collapsible sidebar was judged out of scope for an internal tool)

All three apps re-verified building/booting cleanly after these changes.

### Phase 6 update
**Razorpay Checkout fully wired on the storefront.** Checkout page: address form →
"Pay securely" button → real Razorpay Checkout modal (order created server-side, amount
always recalculated from the DB cart, never trusted from the client) → on success,
payment signature verified server-side, order created, stock decremented, confirmation
email sent → customer lands on a proper order confirmation page (order number, items,
total, address). Payment failure/cancellation shows an inline error with retry.
`npm run build` passes with zero errors.

**Note:** Phase 7 (My Orders) ended up built during Phase 5 already (the Account page
includes full order history), so it's already done - see the phase tracker below.

### Phase 5 update
**OTP login flow built end-to-end on the storefront.** Login modal (email → 6-digit
code), header reflects logged-in state (initials + dropdown with My Orders/Log out),
Account page (sign-in prompt or profile + order history), and Checkout now requires
login and collects a shipping address. Guest cart automatically syncs to the server
cart on successful login (via the backend's `/api/cart/sync`, built in Phase 1).
Payment itself (Razorpay) is intentionally not wired yet — that's Phase 6. `npm run
build` passes with zero errors.

### 📌 Decisions locked in so far

| Decision | Choice | Reasoning |
|---|---|---|
| Guest browsing/cart | Allowed without login; OTP required only at checkout | Better UX, standard e-commerce pattern |
| Admin login method | Email + password (not OTP) | Simpler for a single trusted admin user |
| Order status emails | Yes — placed/confirmed/shipped/delivered/cancelled all email the customer | Already implemented in `mailer.js` / `orderController.js` |
| SMTP/email provider | **Brevo** (formerly Sendinblue) | 300 free emails/day, good deliverability, not tied to personal Gmail |
| Database | MongoDB Atlas free tier (M0, 512MB) | Confirmed sufficient for this scale |
| Image storage | Cloudinary free tier (25 credits/mo) | Confirmed sufficient for ~150-200 products' worth of optimized images; watch bandwidth (not just storage) if traffic grows |
| Product delete behavior | **Hard delete** — removes product from MongoDB *and* its images from Cloudinary, freeing space for a rotating catalog | Safe because `Order.items` stores a snapshot (title/image/price/category) independent of the live Product document, so past orders always display correctly even after the product is deleted. To temporarily hide a product without deleting it, use `PUT /api/admin/products/:id` with `{ isActive: false }` instead. |
| Catalog size | ~100-150 active products across 4 categories | Confirmed to fit comfortably in free-tier DB + Cloudinary |
| Domain | Already owned by the client | Will point subdomain (e.g. `api.yourdomain.com`) at backend host, main domain at Vercel frontend |
| Frontend hosting | Vercel (free tier) | Standard for React SPAs |
| Backend hosting | Render or Railway | Free tier sleeps when idle (20-50s cold start) - fine for development/testing, but should upgrade to the cheapest paid tier (~$7/mo) before real launch so OTP emails don't feel delayed |
| Payment gateway cost | Razorpay — no monthly fee, ~2% per-transaction fee | This is the one unavoidable recurring cost besides possibly backend hosting |

### Environment accounts you'll need to set up (before deploying)
1. MongoDB Atlas free cluster → `MONGODB_URI`
2. Cloudinary free account → cloud name / API key / API secret
3. Razorpay test-mode keys (switch to live keys at launch) → key id / secret / webhook secret
4. **Brevo** account → SMTP relay credentials (see exact `.env` values in Section 13)
5. Render or Railway account for backend hosting
6. Vercel account for frontend hosting
7. DNS access to your existing domain (to point subdomains at the above)

---

## 1. Project Overview

A small-scale e-commerce platform (Amazon/Flipkart-style, but scoped down) selling products across **4 fixed categories**:

1. Kitchen
2. Jewellery
3. Photo Frames
4. Photo Albums

Three user-facing surfaces:

| Surface | Who uses it | Purpose |
|---|---|---|
| **Customer website** | Shoppers | Browse, cart, checkout, pay, track orders |
| **Admin panel** | Store owner/staff | Manage products/images/prices per category, view & export orders |
| **Backend API** | Both | Powers everything above |

No password-based login — customers authenticate via **email OTP** only.

---

## 2. Tech Stack & Why

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + Vite, React Router, TailwindCSS | Fast dev, SPA, matches modern storefront look |
| State/Data fetching | React Query (TanStack Query) + Context (for cart/auth) | Caching, less boilerplate |
| Backend | Node.js + Express.js | REST API |
| Database | MongoDB (Atlas) + Mongoose | Flexible schema, good for product catalogs |
| Image storage | Cloudinary | Upload, auto-optimize, CDN delivery for product images |
| Payments | Razorpay (Orders API + Checkout.js + Webhooks) | Indian payment gateway, supports UPI/cards/netbanking |
| Auth | Email OTP (Nodemailer / SMTP or SendGrid) + JWT | Passwordless login for customers; JWT + role for admin |
| File export (orders) | `pdfkit` or `exceljs` | Admin downloads orders as PDF/Excel |
| Hosting (suggested) | Frontend: Vercel/Netlify · Backend: Render/Railway · DB: MongoDB Atlas | Free/low-cost tiers to start |

---

## 3. High-Level Architecture

```
┌────────────────┐        ┌───────────────────┐        ┌─────────────────┐
│  React Storefront│ <---> │   Express REST API │ <---> │   MongoDB Atlas  │
│  (customer)       │      │   (Node.js)         │      │   (products,      │
└────────────────┘        │                     │      │   users, orders)  │
                           │                     │      └─────────────────┘
┌────────────────┐        │   - Auth (OTP/JWT)   │      ┌─────────────────┐
│  React Admin Panel│ <---> │   - Product CRUD    │ <---> │   Cloudinary     │
│  (owner/staff)    │      │   - Order mgmt       │      │   (images)        │
└────────────────┘        │   - Razorpay webhook │      └─────────────────┘
                           │   - Export orders     │      ┌─────────────────┐
                           └───────────────────┘ <---> │   Razorpay API    │
                                                          └─────────────────┘
```

Two separate React apps (or one app with role-based routing) — recommended: **two apps** sharing a component library, since admin and storefront have very different UX needs. Both talk to the same backend, with admin routes protected by an `isAdmin` middleware.

---

## 4. Database Design (MongoDB Collections)

### 4.1 `users`
```js
{
  _id,
  name: String,
  email: String (unique, indexed),
  phone: String (optional),
  addresses: [{
    label, line1, line2, city, state, pincode, phone, isDefault
  }],
  role: "customer" | "admin",
  createdAt, updatedAt
}
```
No password field — OTP-only login.

### 4.2 `otps`
```js
{
  _id,
  email: String,
  otpHash: String,       // hashed, never store plain OTP
  expiresAt: Date,       // e.g. 5-10 min TTL (MongoDB TTL index)
  attempts: Number,      // rate-limit brute force
  createdAt
}
```

### 4.3 `categories`
```js
{
  _id,
  name: "Kitchen" | "Jewellery" | "Photo Frames" | "Photo Albums",
  slug: "kitchen" | "jewellery" | "photo_frames" | "photo_albums",
  bannerImage: String (Cloudinary URL),
  description: String,
  isActive: Boolean
}
```
Seeded once (4 fixed categories) — admin can edit banner/description but not add/remove categories, per your requirement of exactly 4 sections.

### 4.4 `products`
```js
{
  _id,
  title: String,
  slug: String,
  category: ObjectId (ref: categories),
  description: String,
  images: [{ url: String, publicId: String }],  // Cloudinary
  price: Number,          // current selling price
  mrp: Number,             // optional strike-through price
  discountPercent: Number, // derived or manual
  stock: Number,
  sku: String,
  attributes: {            // flexible per-category fields
    material: String,
    dimensions: String,
    weight: String,
    color: String,
    ...
  },
  isFeatured: Boolean,
  isActive: Boolean,        // soft delete / show-hide
  ratingAvg: Number,
  ratingCount: Number,
  createdAt, updatedAt
}
```

### 4.5 `carts`
```js
{
  _id,
  user: ObjectId (ref: users),
  items: [{ product: ObjectId, quantity: Number, priceAtAdd: Number }],
  updatedAt
}
```
(Alternative: keep cart in frontend localStorage until login, then sync — recommended for good UX so guests can add to cart before logging in.)

### 4.6 `orders`
```js
{
  _id,
  orderNumber: String (human-readable, e.g. TLX-20260715-0001),
  user: ObjectId (ref: users),
  items: [{
    product: ObjectId, title, image, price, quantity, category
  }],
  shippingAddress: { name, line1, line2, city, state, pincode, phone },
  subtotal: Number,
  shippingFee: Number,
  discount: Number,
  totalAmount: Number,
  paymentInfo: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    method: String,
    status: "pending" | "paid" | "failed" | "refunded"
  },
  orderStatus: "placed" | "confirmed" | "shipped" | "delivered" | "cancelled",
  placedAt: Date,          // used for date-wise filtering in admin
  statusHistory: [{ status, timestamp }],
  createdAt, updatedAt
}
```

### 4.7 `admins` (optional, or just `role: admin` inside `users`)
Simplest: reuse `users` collection with `role: "admin"`, and admin login via OTP too (or a separate admin login with email+password for tighter control — recommended for admin since it's a single trusted user, OTP for customers only).

---

## 5. Authentication Flow

### Customer (OTP-based)
1. Customer enters email on login page.
2. Backend generates 6-digit OTP, hashes it, stores in `otps` with 5–10 min expiry, emails it via Nodemailer/SMTP (or SendGrid/Resend for reliability).
3. Customer enters OTP → backend verifies hash + expiry + attempt count.
4. On success: find-or-create `user`, issue JWT (stored in httpOnly cookie or Authorization header), return user profile.
5. Rate-limiting: max 5 OTP requests/hour per email, max 5 verify attempts per OTP.

### Admin
- Since there's only one/few admins, recommend a simpler secure login: email + password (bcrypt-hashed) + JWT, OR reuse OTP flow but restricted to a whitelisted admin email. Either works — OTP keeps things consistent if you prefer one auth pattern across the app.

---

## 6. Customer-Facing Website — Pages & Features

1. **Home page** — hero banner, 4 category tiles (Kitchen/Jewellery/Frames/Albums), featured products, offers strip.
2. **Category listing page** (`/shop/kitchen`, `/shop/jewellery`, etc.) — grid of products, filters (price range, sort by price/newest), pagination.
3. **Product detail page** — image gallery (zoom), title, price, MRP/discount, description, attributes table, stock status, quantity selector, Add to Cart / Buy Now.
4. **Cart page** — line items, quantity edit, remove, subtotal, coupon (optional future), proceed to checkout.
5. **Login / OTP verification page** — modal or dedicated page, triggered at checkout if not logged in.
6. **Checkout page** — shipping address form (or select saved address), order summary, Razorpay payment button.
7. **Order confirmation page** — order number, summary, estimated delivery.
8. **My Orders page** — list of past orders with status, click into order detail/invoice.
9. **My Profile page** — name, email, saved addresses.
10. **Search** (optional nice-to-have) — search bar across all 4 categories.
11. **Static pages** — About, Contact, Shipping/Returns policy, Privacy Policy (good for trust + real payment gateway compliance).

---

## 7. Admin Panel — Pages & Features

### 7.1 Dashboard
- Quick stats: today's orders, revenue this month, low-stock alerts, orders-by-category chart.

### 7.2 Four Category Sections (Kitchen / Jewellery / Frames / Albums)
Each section (could be tabs or sidebar links) has:
- **Product list** (table: image thumbnail, name, price, stock, status, actions)
- **Add Product** form: title, description, price, MRP, stock, SKU, category-specific attributes, **multi-image upload to Cloudinary** (drag-drop, reorder, set cover image)
- **Edit Product**: update price/stock/images/description anytime
- **Delete/Deactivate Product**: soft delete (isActive: false) preferred over hard delete so past orders still show correct product info
- **Bulk actions** (optional): CSV import/export for bulk price updates

### 7.3 Orders Section
- Table of all orders: Order #, Customer name/email, Date, Items count, Amount, Payment status, Order status
- **Filter by date range** (date-wise, as you requested) — e.g. today / this week / custom range / by category
- **Filter by status** (placed/shipped/delivered/cancelled)
- Click into order → full detail (items, address, payment info)
- **Update order status** (mark shipped/delivered) — optionally triggers status email to customer
- **Download orders**:
  - Single order → Invoice PDF
  - Filtered list → Export to Excel (.xlsx) or PDF report, date-range wise, via `exceljs`/`pdfkit`

### 7.4 Customers Section (optional but useful)
- List of registered customers, their order history/lifetime value.

### 7.5 Admin Auth
- Login page, protected routes (JWT + role check middleware on both frontend route guards and backend API).

---

## 8. Backend API Design (REST)

```
Auth
  POST   /api/auth/send-otp
  POST   /api/auth/verify-otp
  POST   /api/auth/admin-login
  GET    /api/auth/me
  POST   /api/auth/logout

Categories
  GET    /api/categories

Products
  GET    /api/products?category=kitchen&sort=&page=
  GET    /api/products/:slug
  POST   /api/admin/products              (admin, multipart image upload)
  PUT    /api/admin/products/:id          (admin)
  DELETE /api/admin/products/:id          (admin)

Cart
  GET    /api/cart
  POST   /api/cart/add
  PUT    /api/cart/update
  DELETE /api/cart/remove/:productId

Orders
  POST   /api/orders/create-razorpay-order   (creates Razorpay order, amount from server-side cart total)
  POST   /api/orders/verify-payment          (verifies signature, creates order record)
  POST   /api/razorpay/webhook               (server-to-server payment confirmation, source of truth)
  GET    /api/orders/my-orders               (customer)
  GET    /api/admin/orders?from=&to=&status= (admin, date-wise filter)
  GET    /api/admin/orders/:id               (admin)
  PUT    /api/admin/orders/:id/status        (admin)
  GET    /api/admin/orders/export?from=&to=&format=xlsx|pdf  (admin download)

Users/Addresses
  GET    /api/users/me
  PUT    /api/users/me
  POST   /api/users/me/addresses
  PUT    /api/users/me/addresses/:id
  DELETE /api/users/me/addresses/:id
```

**Security essentials:** helmet, CORS whitelist, express-rate-limit on auth routes, input validation (Zod/Joi), server-side price calculation (never trust cart totals from frontend — recompute before creating Razorpay order), Razorpay webhook signature verification.

---

## 9. Payment Flow (Razorpay)

1. Customer clicks "Pay Now" at checkout.
2. Backend recalculates order total server-side from DB (never trusts client-sent amount) → creates a Razorpay Order (`POST /api/orders/create-razorpay-order`).
3. Frontend opens Razorpay Checkout modal with the `order_id`.
4. On success, Razorpay returns `payment_id`, `order_id`, `signature` to frontend → frontend sends these to `/api/orders/verify-payment`.
5. Backend verifies signature using Razorpay secret → marks order `paid` → decrements stock → sends confirmation email.
6. **Webhook** (`/api/razorpay/webhook`) also listens independently for `payment.captured`/`payment.failed` events as a safety net in case the frontend callback is missed (e.g., user closes tab).

---

## 10. Image Handling (Cloudinary)

- Admin uploads images via `multer` (memory storage) → streamed to Cloudinary → store returned `secure_url` + `public_id` in the product's `images` array.
- On product delete/image-replace, also delete from Cloudinary using `public_id` to avoid orphaned storage.
- Use Cloudinary transformations (`f_auto,q_auto`, responsive widths) for fast-loading storefront images.

---

## 11. Order Export / Reporting (Admin)

- Date-range picker in Orders section.
- "Export" button → backend generates:
  - **Excel** via `exceljs`: columns = Order#, Date, Customer, Category, Items, Amount, Payment Status, Order Status
  - **PDF** via `pdfkit`: formatted report or individual invoice
- Downloaded as a file stream (`res.setHeader('Content-Disposition', 'attachment; filename=orders_2026-07.xlsx')`).

---

## 12. Suggested Folder Structure

```
project-root/
├── backend/
│   ├── src/
│   │   ├── models/        (User, Product, Category, Order, Cart, Otp)
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/    (auth, isAdmin, rateLimiter, errorHandler)
│   │   ├── services/      (cloudinary, razorpay, mailer, exportService)
│   │   ├── utils/
│   │   └── app.js
│   ├── server.js
│   └── .env
├── frontend-storefront/    (React customer site)
│   └── src/ (pages, components, context, hooks, api)
├── frontend-admin/         (React admin panel)
│   └── src/ (pages, components, context, hooks, api)
└── README.md
```

---

## 13. Environment Variables Needed

```
MONGODB_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=            # your Brevo account login email
SMTP_PASS=            # your Brevo SMTP key (Settings -> SMTP & API), NOT your account password
SMTP_FROM="Tanvi Luxury Store <no-reply@yourdomain.com>"
CLIENT_URL=
ADMIN_URL=
```

> Tip: verify your own domain in Brevo so emails send from `@yourdomain.com` instead of a
> generic address — improves trust and deliverability.

---

## 14. Build Phases (Suggested Order) — Progress Tracker

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Backend: DB models, category seeding, auth (OTP for customers + email/password for admin), product/cart/order/export APIs, Razorpay + webhook, Brevo email service, dashboard stats endpoint | ✅ **Done** |
| 2 | Admin panel frontend (React): login, dashboard, 4 category product sections (add/edit/delete with Cloudinary image upload), orders list with date-range filter + Excel/PDF export | ✅ **Done** — build succeeds, not yet tested against live backend |
| 3 | Storefront frontend (React): home, category pages, product detail (read-only, guest browsing) | ✅ **Done** — rebuilt to match the actual reference design from your screenshots |
| 4 | Cart (frontend localStorage for guests, synced to backend after login) | ✅ **Done** — guest cart syncs to server automatically on OTP login |
| 5 | OTP login/signup flow end-to-end on storefront | ✅ **Done** — login modal, header state, Account page, Checkout now requires login |
| 6 | Checkout + Razorpay Checkout.js integration on storefront | ✅ **Done** — full pay flow with server-side verification and order confirmation page |
| 7 | My Orders (customer-facing order history/tracking page) | ✅ **Done** — built as part of the Account page in Phase 5 |
| 8 | Polish: responsive design, loading/error states, empty states | ✅ **Done** — see Section 0 for specifics |
| 9 | Real credentials wired in: MongoDB Atlas, Cloudinary, Razorpay (test mode), Brevo | 🟡 Guide ready in `SETUP-GUIDE.md` — requires your accounts, waiting on you |
| 10 | Deployment: backend → Render/Railway, frontend + admin → Vercel, domain DNS pointed, Razorpay switched to live keys | ⬜ Not started |

### What Phase 2 delivered (done)
- Admin login page (email + password against the seeded admin account)
- Protected route wrapper (redirects to login if no valid admin JWT; auto-logout on 401)
- Dashboard: quick stats (today's orders, this month's revenue, low-stock alert list, recent orders)
- Product section per category (Kitchen / Jewellery / Photo Frames / Photo Albums):
  - Table view: thumbnail, title, price, stock, active/inactive, edit/delete actions
  - Add Product form: title, description, price, MRP, stock, SKU, category-specific
    attributes, drag-drop multi-image upload (calls the Cloudinary-backed API already built)
  - Edit Product form: same fields, plus ability to remove individual existing images
  - Delete button: calls the hard-delete endpoint (with a confirmation dialog, since it's permanent)
- Orders section: table with date-range picker + status filter, click into order detail,
  update order status (with confirmation buttons), "Export" button for Excel/PDF, "Download invoice" per order

### What Phase 3 delivered (done) — matched to your reference screenshots
- Design system: Playfair Display (serif) + Inter (sans), cream/ink/gold/black palette,
  all pulled directly from the "Sri Tanvi Enterprises" preview screenshots you shared
- Home page: announcement bar, header w/ nav+search+account+cart, hero (split layout),
  "Shop by Story" category grid, "Featured Pieces", "Best Sellers", black "Why Sri Tanvi"
  4-feature strip, "Loved by our patrons" testimonials (your actual quotes), footer
  (your actual WhatsApp/email/location)
- Category listing pages (`/shop`, `/shop/kitchen`, `/shop/jewellery`, `/shop/photo_frames`,
  `/shop/photo_albums`): eyebrow + heading, search + sort, product grid, empty state —
  matches your "Kitchen Products" screenshot exactly
- Product detail page: image gallery, price/MRP/discount, attributes, quantity selector, Add to Bag
- Cart page (guest, localStorage-backed)
- All guest-browsable (no login required yet — that's Phase 5)
- Placeholder pages for `/checkout` and `/account`, styled consistently, so nav doesn't break

---

## 15. Open Questions

**Answered (see Section 0 decisions log):**
- ~~Guest browsing/cart without login?~~ → Yes, OTP only at checkout
- ~~Order-status emails?~~ → Yes, included
- ~~Admin login: OTP or password?~~ → Email + password

**Still open — will decide before Phase 6 (checkout):**
- Any delivery/shipping charge logic, or free shipping across the board? (currently coded
  as flat ₹0 shipping in `orderController.js` — easy to change to a fixed fee or
  weight/location-based logic later)
- Do you want product reviews/ratings, or keep that out of scope for v1? (schema already
  has `ratingAvg`/`ratingCount` placeholder fields on Product, but no review-submission
  flow has been built)

---

**How to resume this project later:** re-read Section 0 above for current status and all
locked-in decisions, then continue from the "Next up" phase.
