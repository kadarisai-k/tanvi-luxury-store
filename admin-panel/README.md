# Tanvi Luxury Store — Admin Panel (Phase 2)

React + Vite + Tailwind admin dashboard for managing products (across the 4 fixed
categories: Kitchen, Jewellery, Photo Frames, Photo Albums) and orders.

## What's included in this phase

- **Login** — email + password against the seeded admin account (backend Phase 1)
- **Protected routing** — redirects to `/login` if not authenticated; auto-logout on
  a 401 from the API (expired/invalid token)
- **Dashboard** — today's order count, this month's order count + revenue, active
  product count, low-stock alert list (5 or fewer in stock), 5 most recent orders
- **Product management** (one page reused for all 4 categories via `/products/:categorySlug`):
  - Table view: thumbnail, title, price/MRP, stock, active/hidden status, edit/delete
  - Search by title
  - Add product: title, description, price, MRP, stock, SKU, material/dimensions/
    weight/color/capacity, multi-image upload (up to 6, drag-in via file picker),
    "feature on homepage" toggle
  - Edit product: same fields, plus removing individual existing images
  - Delete: calls the backend's **hard delete** (removes from MongoDB + Cloudinary),
    with a confirmation dialog since it's permanent
- **Orders**:
  - Date-range filter (with quick "last 7/30/90 days" buttons) + status filter
  - Click a row to open the detail view: customer, shipping address, line items, totals
  - Change order status inline (also triggers the customer status email, per the
    backend's existing logic)
  - Download a single order's invoice as PDF
  - Export the filtered order list as Excel or PDF

## Setup

```bash
cd admin-panel
npm install
cp .env.example .env      # set VITE_API_URL to your backend's URL
npm run dev                # http://localhost:5173 (or whichever port Vite picks)
```

Make sure the backend (Phase 1) is running and `ADMIN_URL` in the backend's `.env`
matches this app's URL (for CORS).

### First login
Use the admin email/password you set in the backend's `.env` (`ADMIN_EMAIL` /
`ADMIN_PASSWORD`) after running `npm run seed` in the backend.

## Verified
`npm run build` completes with no errors (all imports resolve, all JSX compiles).
Not yet tested against a live backend with real data — that requires your MongoDB/
Cloudinary/Razorpay/Brevo credentials to be filled in on the backend first.

## Design notes
Kept deliberately restrained since this is a daily-use internal tool: a plum/gold
accent (a quiet nod to "Tanvi Luxury Store" branding) on a warm off-white canvas,
Fraunces for headings, Inter for UI text — but no decoration that would slow down
someone doing repetitive admin tasks.

## Next
Phase 3: the customer-facing storefront (home, category pages, product detail).
