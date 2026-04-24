<!-- markdownlint-disable MD013 -->

# CLAUDE.md

AI-agent onboarding notes for NivaasHMS. Keep generated work grounded in the current codebase.

## Project Map

```text
client/                         React 19 + Vite 6 frontend
client/src/App.jsx              Client route definitions
client/src/main.jsx             React root, ClerkProvider, AppProvider
client/src/context/             Global app state and axios base URL
client/src/pages/               Guest pages and hotel-owner pages
client/src/components/          Shared UI components
client/src/assets/              Static images, SVGs, and asset exports

server/                         Express 5 + MongoDB API
server/server.js                Entry point and middleware order
server/routes/                  Express route definitions
server/controllers/             Route handlers and provider webhooks
server/middleware/              Clerk auth and Multer upload middleware
server/models/                  Mongoose schemas
server/configs/                 MongoDB, Cloudinary, Nodemailer setup

docs/API.md                     Full API reference
docs/SETUP.md                   Third-party service setup guide
ARCHITECTURE.md                 System diagrams and data flows
```

## Conventions

- JavaScript only; no TypeScript in the current project.
- ES modules across client and server.
- Client styling uses Tailwind CSS v4.
- Client auth uses `@clerk/clerk-react`.
- Server auth uses `@clerk/express` plus `server/middleware/authMiddleware.js`.
- Controllers generally return JSON shaped like `{ success, message }` or `{ success, data }`.
- MongoDB database name is `hotel-booking`, appended in `server/configs/db.js`.
- Client env is read from `import.meta.env`.
- Server env is read from `process.env`, plus Clerk SDK env keys.
- Root tooling owns linting, formatting, commit hooks, and CI quality checks.
- Prettier uses semicolons, single quotes, trailing commas, LF endings, 2 spaces, and 100-character print width.

## Commands

```bash
# Root quality tooling
npm install
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run typecheck
npm run docs:lint
npm run docs:links
npm run check

# Server
cd server
npm install
npm run server
npm start
npm run check

# Client
cd client
npm install
npm run dev
npm run build
npm run lint
npm run check
npm run preview
```

## Where Things Live

- Auth middleware: `server/middleware/authMiddleware.js`
- Upload middleware: `server/middleware/uploadMiddleware.js`
- Stripe payment creation: `server/controllers/bookingController.js`
- Stripe webhook confirmation: `server/controllers/stripeWebhooks.js`
- Clerk user sync webhook: `server/controllers/clerkWebhooks.js`
- Global client state: `client/src/context/AppContext.jsx`
- Client routes: `client/src/App.jsx`
- API routes: `server/routes/`
- Data models: `server/models/`

## Things To Avoid

- Do not commit real `.env` or `.env.local` files.
- Do not claim features in docs unless they map to current routes, pages, controllers, or models.
- Do not move `POST /api/stripe` behind `express.json()`; Stripe signature verification needs `express.raw()`.
- Do not change application code when the task is documentation-only.
- Do not add fake demo URLs, screenshots, emails, or production claims.
- Do not mock MongoDB or provider flows in integration work unless the task explicitly asks for test isolation.
- Do not introduce TypeScript, new frameworks, or dependency upgrades unless the task explicitly asks for it.
- Do not bypass Husky, lint-staged, commitlint, ESLint, or Prettier when preparing changes.

## Current Route Surface

```text
GET  /
GET  /api/user
POST /api/user/store-recent-search
POST /api/hotels
POST /api/rooms
GET  /api/rooms
GET  /api/rooms/owner
POST /api/rooms/toggle-availability
POST /api/bookings/check-availability
POST /api/bookings/book
GET  /api/bookings/user
GET  /api/bookings/hotel
POST /api/bookings/stripe-payment
POST /api/stripe
POST /api/clerk
```

## Verification Habits

- Run `git status --short` before and after edits.
- For docs changes, run:

```bash
npm run docs:lint
npm run docs:links
```

- For env parity, compare `.env.example` files with:

```bash
rg "process\\.env\\." server
rg "import\\.meta\\.env\\." client/src
```
