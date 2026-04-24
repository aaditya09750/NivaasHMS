<!-- markdownlint-disable MD013 -->

# Contributing to NivaasHMS

Thanks for helping improve NivaasHMS. This repo is a functional MVP, so the best contributions are clear, scoped, and tied to behavior that already exists or to a documented roadmap item.

## Code of Conduct

All contributors are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Local Development

1. Install dependencies:

```bash
cd NivaasHMS
npm install

cd server
npm install

cd ../client
npm install
```

1. Copy environment templates:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

PowerShell equivalent:

```powershell
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env.local
```

1. Fill in MongoDB Atlas, Clerk, Stripe, Cloudinary, and Brevo values. See [docs/SETUP.md](docs/SETUP.md).

1. Run both packages:

```bash
# Terminal 1
cd server
npm run server

# Terminal 2
cd client
npm run dev
```

1. For payment work, run Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe
```

## Branch Naming

Use short, descriptive branch names:

- `feat/<short-description>` for new user-facing behavior.
- `fix/<short-description>` for bug fixes.
- `docs/<short-description>` for documentation.
- `chore/<short-description>` for maintenance.

Examples:

```text
docs/api-reference
fix/booking-date-overlap
chore/server-lint-config
```

## Commit Convention

Use Conventional Commits:

```text
feat: add owner revenue filter
fix: handle missing hotel on owner rooms
docs: document Stripe webhook setup
chore: add CI workflow
```

Scopes are welcome when useful:

```text
wip(env): document local Clerk setup
fix(bookings): prevent empty guest count
```

## Pull Request Checklist

Before opening a PR:

- The change is scoped to one clear problem.
- The full quality gate passes with `npm run check` from the repo root.
- Staged files pass the pre-commit `lint-staged` hook.
- New or changed environment variables are documented in the relevant `.env.example` and README table.
- Stripe webhook changes were tested with Stripe CLI when payment behavior is affected.
- Clerk webhook changes were tested with a real tunnel or clearly marked as untested.
- Screenshots or screen recordings are attached for UI changes.
- Documentation is updated when behavior, setup, routes, or env requirements change.

## Code Style

- JavaScript uses ES modules across client and server.
- The project currently does not use TypeScript.
- Client code uses the existing React, Vite, Tailwind, Axios, and Clerk patterns.
- Root ESLint owns both client and server linting through `eslint.config.js`.
- Prettier owns formatting; do not hand-format around it.
- Run `npm run lint`, `npm run format:check`, and `npm run typecheck` through `npm run check`.
- Commit messages must follow Conventional Commits and are enforced by commitlint.
- Keep controller responses aligned with the existing `{ success, message/data }` style unless a larger API cleanup is intentionally planned.
- Do not move the Stripe webhook behind `express.json()` without changing signature verification.

## Documentation Rules

- Do not claim features that are not backed by code in `client/src` or `server`.
- Put unbuilt ideas in the README roadmap, not in the feature list.
- Use placeholders for demos, screenshots, and contact links until real values exist.
- Never commit `.env`, `.env.local`, provider secrets, API keys, or webhook signing secrets.

## Good First Issues

- Add Vitest or Jest test scaffolding.
- Add request body validation for booking and room endpoints.
- Add MongoDB indexes for booking conflict checks.
- Add webhook idempotency for Stripe and Clerk event delivery.
- Restrict CORS by environment for production deployments.

## Reporting Bugs

Use the bug report template and include:

- Steps to reproduce.
- Expected behavior.
- Actual behavior.
- Browser and OS for client bugs.
- Relevant API route, request body, and response for server bugs.
- Whether Clerk, Stripe, Cloudinary, MongoDB, or Brevo were involved.

Security issues should not be filed publicly. Follow [SECURITY.md](SECURITY.md).
