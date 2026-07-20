# Tanvi Luxury Store — Full Project

One combined folder for the whole build: backend API, admin panel, and customer storefront.

```
tanvi-luxury-store/
├── README.md               ← this file
├── PROJECT-SPEC.md         ← full spec, decisions log, progress tracker (Section 0)
├── SETUP-GUIDE.md          ← step-by-step: MongoDB/Cloudinary/Razorpay/Brevo account setup
├── backend/                Node.js + Express + MongoDB API (Phase 1 - done)
├── admin-panel/            React admin dashboard (Phase 2 - done)
└── storefront/             React customer-facing site (Phase 3 - done)
```

## Where to look

- **Coming back after a break?** Open `PROJECT-SPEC.md` → Section 0 at the very top has
  current status, every decision made so far, and what's next.
- **Ready to get real credentials set up?** Open `SETUP-GUIDE.md` — step-by-step for
  MongoDB Atlas, Cloudinary, Razorpay, and Brevo, including exactly what to paste into
  `.env` and how to test everything end-to-end locally.
- **Each subfolder has its own README** with exact setup steps (`npm install`, `.env`
  values needed, what that piece does).

## Quick start (local development)

You'll need 3 terminal windows/tabs, one per folder:

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env      # fill in MongoDB/Cloudinary/Razorpay/Brevo credentials
npm run seed                # creates the 4 categories + first admin user
npm run dev                  # http://localhost:5000

# 2. Admin panel
cd admin-panel
npm install
cp .env.example .env
npm run dev                  # http://localhost:5173 (or next free port)

# 3. Storefront
cd storefront
npm install
cp .env.example .env
npm run dev                  # will pick the next free port after admin-panel
```

Both frontends point at the backend via `VITE_API_URL` in their `.env` files — make sure
it matches wherever the backend is actually running.

## Status at a glance

| Piece | Status |
|---|---|
| Backend API | ✅ Built, boots cleanly. Needs real credentials to fully function. |
| Admin panel | ✅ Built, `npm run build` passes. Not yet tested against live backend. |
| Storefront | ✅ Built to match the reference design, `npm run build` passes. |
| OTP login (storefront) | ✅ Done — login modal, header state, Account page, cart syncs on login |
| Razorpay checkout (storefront) | ✅ Done — full pay flow + order confirmation page |
| My Orders (storefront) | ✅ Done — built into the Account page |
| Responsive/polish pass | ✅ Done — see PROJECT-SPEC.md Section 0 for specifics |
| Real credentials wired in | 🟡 Guide ready in `SETUP-GUIDE.md` — needs your accounts |
| Deployment | ⬜ Not started |

Full detail on all of this is in `PROJECT-SPEC.md`.
