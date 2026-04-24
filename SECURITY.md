<!-- markdownlint-disable MD013 -->

# Security Policy

## Supported Versions

NivaasHMS is currently a functional MVP. Security fixes are accepted against the default branch.

| Version                 | Supported         |
| ----------------------- | ----------------- |
| `main` / default branch | Yes               |
| Released packages       | Not yet published |

## Reporting a Vulnerability

Please do not open a public GitHub issue for a suspected vulnerability.

<!-- TODO: Add a private security contact email before public launch. -->

Until a private email is published, contact the maintainer privately through the repository owner's preferred profile channel and include:

- Affected route, page, or workflow.
- Reproduction steps.
- Expected impact.
- Whether credentials, payments, uploads, or personal data are involved.
- Any logs or screenshots that do not expose secrets.

The maintainer should acknowledge valid reports within 72 hours when the project is actively maintained.

## Known Security Boundaries

These are known gaps in the current codebase and are documented here so contributors can prioritize them. They are not fixed by this documentation scaffold.

- CORS is currently permissive through `app.use(cors())`.
- Public endpoints do not yet have rate limiting.
- Request bodies are not centrally validated.
- Webhook handlers do not yet enforce idempotency for repeated provider events.
- Server-side authorization should be reviewed before adding broader ownership models.
- Uploaded room images are accepted through Multer and sent to Cloudinary; file type and size policy should be hardened before production use.

## Secret Handling

- Never commit `.env` or `.env.local`.
- Rotate Clerk, Stripe, Cloudinary, Brevo, and MongoDB credentials if they are exposed.
- Use provider-specific webhook signing secrets for each environment.
- Keep Stripe's raw-body webhook route behavior intact unless signature verification is rewritten.
