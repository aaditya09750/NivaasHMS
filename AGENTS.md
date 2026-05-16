<!-- markdownlint-disable MD013 -->

# AGENTS.md

Single source of agent guidance for the NivaasHMS repository. Any AI coding agent operating in this codebase should read this file first. It follows the open [agents.md](https://agents.md) convention and supersedes tool-specific config files.

## Project Overview

NivaasHMS is a full-stack hotel reservations MVP. The repository contains two deployable packages plus a root tooling layer:

- `client/` — React 19 + Vite 6 single-page app (guest browsing, owner dashboard).
- `server/` — Express 5 + Mongoose API on MongoDB Atlas (auth, rooms, bookings, payment, webhooks).
- Root — shared linting, formatting, commit hooks, docs checks, and CI quality gate.

Authoritative narrative docs: [README.md](README.md), [ARCHITECTURE.md](ARCHITECTURE.md), [docs/API.md](docs/API.md), [docs/SETUP.md](docs/SETUP.md). When this file and the code disagree, the code wins; update this file rather than the code.

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
server/models/                  Mongoose schemas (User, Hotel, Room, Booking)
server/configs/                 MongoDB, Cloudinary, Nodemailer setup

docs/API.md                     Full API reference
docs/SETUP.md                   Third-party service setup guide
ARCHITECTURE.md                 System diagrams and data flows
```

## Setup

Prerequisites:

- Node.js `>=22` and npm `>=10` (enforced in root `package.json` engines).
- A MongoDB Atlas cluster (or compatible Mongo instance).
- Clerk, Stripe, Cloudinary, and Brevo SMTP accounts for full feature parity.
- Stripe CLI for local webhook forwarding.

Install dependencies (three packages, installed separately):

```bash
npm install
npm --prefix server install
npm --prefix client install
```

Create local environment files from the checked-in templates and fill them in:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

Variable purpose and required-ness is documented in the README and [docs/SETUP.md](docs/SETUP.md). Server env is read from `process.env`; client env is read from `import.meta.env`.

## Dev Commands

Root quality gate:

| Command                | Purpose                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| `npm run lint`         | ESLint across `client` and `server` with `--max-warnings=0`.        |
| `npm run lint:fix`     | Auto-fix lint issues where safe.                                    |
| `npm run format`       | Prettier write.                                                     |
| `npm run format:check` | Prettier verify (no writes).                                        |
| `npm run typecheck`    | `node --check` on server entry + production client build.           |
| `npm run docs:lint`    | `markdownlint` over all Markdown.                                   |
| `npm run docs:links`   | `markdown-link-check` for the long-form docs.                       |
| `npm run check`        | Full local/CI quality gate: lint + format check + typecheck + docs. |

Server (`server/`):

| Command          | Purpose                                       |
| ---------------- | --------------------------------------------- |
| `npm run server` | Start API with nodemon for local development. |
| `npm start`      | Start API with `node`.                        |
| `npm run check`  | Server-scoped lint and syntax check.          |

Client (`client/`):

| Command           | Purpose                             |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start the Vite dev server.          |
| `npm run build`   | Production build to `client/dist/`. |
| `npm run preview` | Preview the built bundle locally.   |
| `npm run check`   | Delegate to the root quality gate.  |

Local Stripe webhook forwarding:

```bash
stripe listen --forward-to localhost:3000/api/stripe
```

Copy the printed `whsec_...` value into `server/.env` as `STRIPE_WEBHOOK_SECRET` and restart the API.

## Conventions

- JavaScript only; do not introduce TypeScript.
- ES modules across client and server (`"type": "module"`).
- Client styling: Tailwind CSS v4 utility classes.
- Client auth: `@clerk/clerk-react` via `ClerkProvider` in [client/src/main.jsx](client/src/main.jsx).
- Server auth: `@clerk/express` global middleware plus `protect` in [server/middleware/authMiddleware.js](server/middleware/authMiddleware.js).
- Controllers return JSON shaped as `{ success: boolean, message?: string }` or `{ success: boolean, data?: T }`.
- MongoDB database name is `hotel-booking`, appended to `MONGODB_URI` in [server/configs/db.js](server/configs/db.js).
- Prettier: semicolons, single quotes, trailing commas, 2-space indent, LF endings, 100-char print width. Configured in [.prettierrc.json](.prettierrc.json).
- ESLint flat config in [eslint.config.js](eslint.config.js) — applies React/Vite rules to `client/` and Node/Express rules to `server/`.
- Commit messages follow Conventional Commits (enforced by commitlint).

## Where Things Live

| Concern                        | Location                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| Clerk auth guard               | [server/middleware/authMiddleware.js](server/middleware/authMiddleware.js)         |
| Multer upload middleware       | [server/middleware/uploadMiddleware.js](server/middleware/uploadMiddleware.js)     |
| Stripe Checkout session create | [server/controllers/bookingController.js](server/controllers/bookingController.js) |
| Stripe webhook confirmation    | [server/controllers/stripeWebhooks.js](server/controllers/stripeWebhooks.js)       |
| Clerk user sync webhook        | [server/controllers/clerkWebhooks.js](server/controllers/clerkWebhooks.js)         |
| MongoDB connection             | [server/configs/db.js](server/configs/db.js)                                       |
| Cloudinary setup               | [server/configs/cloudinary.js](server/configs/cloudinary.js)                       |
| Brevo SMTP transporter         | [server/configs/nodemailer.js](server/configs/nodemailer.js)                       |
| API route mounting             | [server/server.js](server/server.js) and [server/routes/](server/routes/)          |
| Mongoose schemas               | [server/models/](server/models/) (`User`, `Hotel`, `Room`, `Booking`)              |
| Global client state            | [client/src/context/AppContext.jsx](client/src/context/AppContext.jsx)             |
| Client routes                  | [client/src/App.jsx](client/src/App.jsx)                                           |

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

Full request/response shapes, auth requirements, and error cases live in [docs/API.md](docs/API.md).

## Webhook & Middleware Ordering

[server/server.js](server/server.js) sets a specific middleware order that must not be reshuffled:

1. `cors()` — global CORS.
2. `express.raw({ type: 'application/json' })` mounted **only** on `POST /api/stripe`.
3. `express.json()` — JSON body parser for all other routes.
4. `clerkMiddleware()` — Clerk request context.
5. `POST /api/clerk` — Svix-verified Clerk user sync.

Stripe webhook signature verification operates on the raw request body. Moving `POST /api/stripe` behind `express.json()` silently breaks signature checks and is the single most common regression to guard against.

## Commit & PR Guidelines

- Conventional Commits required (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, etc.). Validated by `commitlint` on the `commit-msg` hook.
- `pre-commit` runs `lint-staged` against staged files.
- `pre-push` runs `npm run check` (full quality gate).
- Do not bypass hooks (`--no-verify`, `--no-gpg-sign`). Fix the failing check instead.
- GitHub Actions runs `npm run check` for pull requests and pushes to `main`/`master`.
- Match the scope of changes to the task; do not bundle unrelated refactors with feature work.

## Security & Secrets

- Never commit real `server/.env` or `client/.env.local`. Only the `.env.example` templates belong in git.
- Clerk webhook (`POST /api/clerk`) is verified via Svix headers + `CLERK_WEBHOOK_SECRET`.
- Stripe webhook (`POST /api/stripe`) is verified via `Stripe-Signature` + `STRIPE_WEBHOOK_SECRET` on the raw body.
- API CORS is currently open (`cors()` with no allowlist). Locking it down is tracked as a known hardening gap — do not silently flip it without coordinating with the deployment story.
- Report vulnerabilities through [SECURITY.md](SECURITY.md), not public issues.

## Things to Avoid

- Do not commit real `.env` / `.env.local` files.
- Do not claim features in docs unless they map to current routes, pages, controllers, or models.
- Do not move `POST /api/stripe` behind `express.json()`; signature verification needs the raw body.
- Do not change application code when the task is documentation-only.
- Do not add fake demo URLs, screenshots, emails, or production claims.
- Do not mock MongoDB or provider flows in integration work unless the task explicitly asks for test isolation.
- Do not introduce TypeScript, new frameworks, or dependency upgrades unless the task explicitly asks for it.
- Do not bypass Husky, lint-staged, commitlint, ESLint, or Prettier when preparing changes.
- Do not invent routes, env variables, or schema fields that are not present in code.

## Verification Before Claiming Done

- `git status --short` before and after edits.
- For docs changes:

  ```bash
  npm run docs:lint
  npm run docs:links
  ```

- Before declaring code changes complete:

  ```bash
  npm run check
  ```

- For environment-variable parity audits, compare templates against actual reads:

  ```bash
  rg "process\.env\." server
  rg "import\.meta\.env\." client/src
  ```

- For UI work, exercise the feature in the running Vite dev server; type checks and lint do not verify behaviour.
