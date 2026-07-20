# Tanvi Luxury Store — Backend (Phase 1)

Node.js + Express + MongoDB backend for the 4-category mini e-commerce store
(Kitchen, Jewellery, Photo Frames, Photo Albums).

## What's included in this phase

- MongoDB models: `User`, `Otp`, `Category`, `Product`, `Cart`, `Order`
- Auth:
  - Customer login via **email OTP** (`/api/auth/send-otp`, `/api/auth/verify-otp`)
  - Admin login via **email + password** (`/api/auth/admin-login`)
- Category endpoints (4 fixed categories, seeded once)
- Product endpoints: public browse/search + admin CRUD with **Cloudinary** multi-image upload
- Cart endpoints (guest cart syncs to server on login via `/api/cart/sync`)
- Order flow: **Razorpay** order creation → payment verification → order record →
  stock decrement → confirmation email, plus a webhook safety net
- Admin order management: list with **date-range + status filters**, status updates
  (triggers status emails), and **Excel/PDF export** + single-order invoice PDF

## Setup

```bash
cd backend
npm install
cp .env.example .env      # fill in your real MongoDB/Cloudinary/Razorpay/Gmail values
npm run seed               # creates the 4 categories + first admin user
npm run dev                 # starts on http://localhost:5000
```

### Required accounts before this works end-to-end
1. **MongoDB Atlas** — free cluster, get the connection string → `MONGODB_URI`
2. **Cloudinary** — free account → cloud name, API key, API secret
3. **Razorpay** — test mode keys are enough for development → key id/secret + a webhook secret
   (set the webhook URL in the Razorpay dashboard to `https://<your-backend-domain>/api/webhooks/razorpay`
   once deployed, subscribed to `payment.captured` and `payment.failed`)
4. **Gmail App Password** — for sending OTP/order emails (see `src/services/mailer.js` for the
   2-minute setup). Optional for local dev: without it, OTPs print to the server console instead.

### First admin login
After `npm run seed`, log in to the admin panel with the `ADMIN_EMAIL` / `ADMIN_PASSWORD`
you set in `.env` (defaults to `admin@tanvistore.com` / `ChangeMe123!` — **change this**).

## Verified

All files have been syntax-checked and the Express app boots and registers every
route successfully with dummy environment variables (no live DB/Cloudinary/Razorpay
calls made yet — those need your real credentials in `.env`).

## Next phases (per the project spec doc)
- Phase 2: Admin panel frontend (React) — product CRUD UI for all 4 categories
- Phase 3: Storefront frontend (React) — home, category, product pages
- Phase 4-6: Cart UX, OTP login UI, checkout + Razorpay Checkout.js integration
- Phase 7-8: My Orders (customer) + order management/export UI (admin)
- Phase 9-10: Polish, responsive design, deployment
