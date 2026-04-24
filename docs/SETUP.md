<!-- markdownlint-disable MD013 MD033 -->

# Extended Setup Guide

Use this guide after the fast path in the root [README](../README.md). It walks through every third-party service used by the current codebase.

## Prerequisites

- Node.js 20 or newer.
- npm.
- A MongoDB Atlas account.
- A Clerk account.
- A Stripe account and Stripe CLI.
- A Cloudinary account.
- A Brevo account with SMTP enabled.
- Optional for local Clerk webhooks: ngrok, Cloudflare Tunnel, or another HTTPS tunnel.

## 1. MongoDB Atlas

<!-- TODO: screenshot - MongoDB Atlas cluster connection modal. -->

1. Create a MongoDB Atlas project and cluster.
2. Create a database user with read/write access.
3. Add your current IP address to Network Access for local development.
4. Copy the driver connection string.
5. In `server/.env`, set:

```dotenv
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net
```

Do not append `/hotel-booking`. The app already does that in [server/configs/db.js](../server/configs/db.js).

Pitfall: avoid `@` in the database user's password unless you URL-encode it. The repo already has a source comment warning about this in `server/configs/db.js`.

## 2. Clerk

<!-- TODO: screenshot - Clerk API keys page. -->

1. Create a Clerk application.
2. In the Clerk dashboard, open API keys.
3. Copy the publishable key and secret key.
4. In `server/.env`, set:

```dotenv
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx
```

1. In `client/.env.local`, set:

```dotenv
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
```

### Clerk Webhook

<!-- TODO: screenshot - Clerk webhook endpoint creation. -->

The app syncs Clerk users into MongoDB at `POST /api/clerk`.

For local development, expose the API with an HTTPS tunnel:

```bash
ngrok http 3000
```

Then create a Clerk webhook endpoint:

```text
Endpoint URL: https://<your-tunnel-domain>/api/clerk
Events: user.created, user.updated, user.deleted
```

Copy the webhook signing secret into `server/.env`:

```dotenv
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
```

Restart the server after changing the secret.

## 3. Cloudinary

<!-- TODO: screenshot - Cloudinary dashboard API environment values. -->

Room creation uploads images to Cloudinary from [server/controllers/roomController.js](../server/controllers/roomController.js).

1. Create or open a Cloudinary account.
2. Copy the cloud name, API key, and API secret from the dashboard.
3. In `server/.env`, set:

```dotenv
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=xxxxxxxxxxxxxxx
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

The current Multer config uses disk storage, and the controller passes each uploaded file path to `cloudinary.uploader.upload`.

## 4. Brevo SMTP

<!-- TODO: screenshot - Brevo SMTP credentials page. -->

Booking creation sends a confirmation email through Nodemailer using Brevo SMTP. The host and port are hardcoded in [server/configs/nodemailer.js](../server/configs/nodemailer.js):

```text
smtp-relay.brevo.com:587
```

1. Create or open a Brevo account.
2. Enable SMTP if needed.
3. Open SMTP & API.
4. Copy the SMTP login and password.
5. Verify a sender email or sending domain.
6. In `server/.env`, set:

```dotenv
SMTP_USER=your-smtp-login@example.com
SMTP_PASS=xxxxxxxxxxxxxxxxxxxxxxxx
SENDER_EMAIL=no-reply@example.com
```

Optional:

```dotenv
CURRENCY=$
```

`CURRENCY` is used only in booking confirmation email totals and defaults to `$` if unset.

## 5. Stripe

<!-- TODO: screenshot - Stripe API keys and webhook secret. -->

The app creates Stripe Checkout Sessions in [server/controllers/bookingController.js](../server/controllers/bookingController.js), then marks bookings paid from [server/controllers/stripeWebhooks.js](../server/controllers/stripeWebhooks.js).

1. Create or open a Stripe account.
2. In Developers -> API keys, copy your test secret key.
3. In `server/.env`, set:

```dotenv
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
```

The current server code reads `STRIPE_SECRET_KEY`. `STRIPE_PUBLISHABLE_KEY` is included in the env template for Stripe dashboard parity but is not directly read by current application code.

### Local Stripe Webhook Testing

Install and log in to the Stripe CLI, then forward events:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe
```

Copy the CLI-generated signing secret:

```dotenv
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
```

Keep the Stripe CLI process running while testing checkout locally.

Useful test card:

```text
4242 4242 4242 4242
Any future expiry
Any three-digit CVC
Any ZIP/postal code
```

## 6. Wire Everything Up

Copy env templates:

```bash
# macOS/Linux/Git Bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

```powershell
# PowerShell
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env.local
```

Install dependencies:

```bash
cd server
npm install

cd ../client
npm install
```

Run the app:

```bash
# Terminal 1
cd server
npm run server

# Terminal 2
cd client
npm run dev

# Terminal 3, when testing Stripe payments
stripe listen --forward-to localhost:3000/api/stripe

# Terminal 4, when testing Clerk local webhooks
ngrok http 3000
```

Visit `http://localhost:5173` for the client and `http://localhost:3000/` for the API health check.

## 7. Common Pitfalls

### Missing Vite Env Prefix

Client-side variables must start with `VITE_`. If `VITE_CLERK_PUBLISHABLE_KEY` is missing, [client/src/main.jsx](../client/src/main.jsx) throws on startup.

### Vite Env Changes Not Picked Up

Restart `npm run dev` after editing `client/.env.local`. Vite reads env files when the dev server starts.

### API Requests Go to the Wrong Host

The client sets `axios.defaults.baseURL` from `VITE_BACKEND_URL` in [client/src/context/AppContext.jsx](../client/src/context/AppContext.jsx). Use no trailing slash:

```dotenv
VITE_BACKEND_URL=http://localhost:3000
```

### Stripe Webhook Secret Mismatch

Stripe CLI secrets and Dashboard webhook secrets are different. Use the CLI `whsec_...` while forwarding locally, and use the Dashboard endpoint secret in production.

### Stripe Webhook Breaks After Middleware Changes

`POST /api/stripe` must keep `express.raw({ type: "application/json" })` before `express.json()` in [server/server.js](../server/server.js). Stripe signature verification depends on the raw body.

### Clerk Webhook Fails Locally

Clerk requires a reachable HTTPS endpoint. Use a tunnel and update the Clerk webhook URL each time the tunnel domain changes. Also confirm the selected events include `user.created`, `user.updated`, and `user.deleted`.

### CORS Works Locally But Needs Production Hardening

The API currently uses permissive `cors()`. That avoids local setup friction, but production should restrict allowed origins to the deployed client URL.

### MongoDB Connection Fails

Check Atlas network access, credentials, and URI encoding. The app appends `/hotel-booking`, so the env value should stop at `.mongodb.net`.

### Owner Routes Have No Data

The owner dashboard depends on this order:

1. Clerk user exists.
2. Clerk webhook synced the user into MongoDB.
3. User registered a hotel through `POST /api/hotels`.
4. Rooms were added for that hotel.

If step 2 fails, protected API routes may authenticate with Clerk but not find the Mongo user expected by `protect`.
