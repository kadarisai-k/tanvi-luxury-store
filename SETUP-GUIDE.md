# Setup Guide — Getting Real Credentials (Phase 9)

This walks you through creating every account the backend needs, and exactly where to
paste each value into `backend/.env`. Do these in order — some steps depend on earlier
ones (e.g. you need the backend running before Razorpay's webhook step makes sense).

Copy `backend/.env.example` to `backend/.env` first, then fill it in as you go.

---

## 1. MongoDB Atlas (database)

1. Go to https://www.mongodb.com/cloud/atlas/register and sign up (free).
2. Create a new **Project** (any name, e.g. "Tanvi Store").
3. Click **Build a Database** → choose the **M0 Free** tier → pick a region close to
   your users (e.g. Mumbai `ap-south-1` for India) → Create.
4. **Database Access** (left sidebar) → **Add New Database User**:
   - Username/password authentication (save this password somewhere safe)
   - Give it "Read and write to any database" permission
5. **Network Access** (left sidebar) → **Add IP Address**:
   - For development: "Allow access from anywhere" (`0.0.0.0/0`) is fine
   - For production: once deployed, restrict this to your hosting provider's IPs if they're static, or keep it open if using a platform with dynamic IPs (most small setups keep this open and rely on the strong DB password)
6. **Database** (left sidebar) → **Connect** → **Drivers** → copy the connection string.
   It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Paste it into `.env` as `MONGODB_URI`, replacing `<username>`/`<password>` with your
   actual values, and add a database name before the `?`, e.g.:
   ```
   MONGODB_URI=mongodb+srv://tanvi_admin:yourpassword@cluster0.xxxxx.mongodb.net/tanvi_store?retryWrites=true&w=majority
   ```

---

## 2. Cloudinary (image storage)

1. Go to https://cloudinary.com/users/register/free and sign up (free).
2. Once in the dashboard, you'll immediately see your **Cloud Name**, **API Key**, and
   **API Secret** right at the top.
3. Paste them into `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
That's it — no further configuration needed, the backend already handles folder
structure and image optimization.

---

## 3. Razorpay (payments)

1. Go to https://dashboard.razorpay.com/signup and sign up.
2. You'll start in **Test Mode** by default (toggle top-right) — keep it in Test Mode
   for now, you can switch to Live Mode later once you've verified everything works
   and completed Razorpay's KYC/business verification (required before accepting real
   payments).
3. **Settings** → **API Keys** → **Generate Test Key** → copy the Key ID and Key Secret.
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
   ```
4. **Webhook setup** (do this after your backend is deployed and has a public URL —
   skip for now if you're only testing locally):
   - **Settings** → **Webhooks** → **Add New Webhook**
   - Webhook URL: `https://your-backend-domain.com/api/webhooks/razorpay`
   - Active events: check `payment.captured` and `payment.failed`
   - Set a webhook secret (any string you choose) and copy it:
   ```
   RAZORPAY_WEBHOOK_SECRET=whatever_secret_you_set
   ```
5. **Test payments**: Razorpay's test mode accepts these without charging real money:
   - Test card: `4111 1111 1111 1111`, any future expiry, any CVV
   - Test UPI: success with `success@razorpay`, failure with `failure@razorpay`
   - Full list: https://razorpay.com/docs/payments/payments/test-card-upi-details/

---

## 4. Gmail App Password (email delivery for OTPs)

No signup, no paid tier, no "free quota ran out" wall — just a Gmail account
you control. A regular Gmail account sends ~500 emails/day via SMTP for free,
which is effectively unlimited for a single store's OTP + order-update volume.

1. Use any Gmail address (a fresh one just for the store is a good idea).
2. Turn on 2-Step Verification: https://myaccount.google.com/security
3. Create an App Password: https://myaccount.google.com/apppasswords
   (choose app "Mail", device "Other" → name it "Tanvi Store"). Copy the
   16-character password shown.
4. Paste into `.env`:
   ```
   GMAIL_USER=youraddress@gmail.com
   GMAIL_APP_PASSWORD=the_16_character_app_password
   MAIL_FROM_NAME="Tanvi Luxury Store"
   ```

Leave `GMAIL_USER`/`GMAIL_APP_PASSWORD` blank and the app still works — OTPs
are printed to the server console instead of emailed, so local dev/testing
never blocks on SMTP setup.

---

## 5. Admin account & JWT secrets

This doesn't need a signup — just generate a random secret for signing the
admin JWT (customer login is email-OTP and doesn't use a JWT at all):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste the output into:
```
ADMIN_JWT_SECRET=<the random string>
```

Then set your real admin login:
```
ADMIN_EMAIL=youractualemail@example.com
ADMIN_PASSWORD=SomethingStrongAndUnique123!
ADMIN_NAME=Your Name
```

---

## 6. Run the seed script

Once every value above is filled into `backend/.env`:

```bash
cd backend
npm install
npm run seed
```

This creates the 4 fixed categories (Kitchen, Jewellery, Photo Frames, Photo Albums)
and your first admin user, using the `ADMIN_EMAIL`/`ADMIN_PASSWORD` you just set.

---

## 7. Test it end-to-end locally

```bash
# Terminal 1
cd backend && npm run dev            # http://localhost:5000

# Terminal 2
cd admin-panel && npm install && npm run dev   # log in with ADMIN_EMAIL/ADMIN_PASSWORD, add a product or two

# Terminal 3
cd storefront && npm install && npm run dev    # browse, add to cart, check out with a Razorpay test card
```

If an OTP email doesn't arrive within a few seconds, check:
- The backend terminal — if `GMAIL_USER`/`GMAIL_APP_PASSWORD` aren't set, the OTP is
  printed there instead of emailed (dev fallback), which also means login still works
- Your spam folder
- That `GMAIL_APP_PASSWORD` is the 16-character **App Password**, not your normal Gmail password
- That 2-Step Verification is turned on for the Gmail account (required for App Passwords)

---

## Troubleshooting quick-reference

| Problem | Likely cause |
|---|---|
| Backend won't start, MongoDB connection error | Check `MONGODB_URI` password is correct and IP access is allowed in Atlas |
| Image upload fails in admin panel | Double check Cloudinary credentials, and that `CLOUDINARY_API_SECRET` has no extra spaces |
| Razorpay checkout modal doesn't open | Check browser console — usually a wrong `RAZORPAY_KEY_ID` or the backend's create-order call failing |
| OTP email never arrives | See "Test it end-to-end" troubleshooting above |
| Admin login fails after seeding | Make sure you're using the exact `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `.env` at the time you ran `npm run seed` — changing `.env` afterward doesn't retroactively change the already-created admin user in the database |

---

Once all of this is working locally, you're ready for **Phase 10: deployment** —
pushing the backend to Render/Railway, both frontends to Vercel, and pointing your
domain at them.
