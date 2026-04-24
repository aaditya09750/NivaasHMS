<!-- markdownlint-disable MD013 MD033 -->

# Architecture

NivaasHMS is a two-package JavaScript monorepo:

- `client/`: React 19, Vite 6, Tailwind 4, Clerk React, React Router.
- `server/`: Express 5, Mongoose 8, Clerk Express, Stripe, Cloudinary, Nodemailer/Brevo.

The server owns booking, room, hotel, user sync, payment, upload, and email side effects. The client owns routing, presentation, authenticated API calls, and shared UI state.

## System Context

```mermaid
flowchart TD
  User[Guest or Hotel Owner] --> Browser[Browser]
  Browser --> Vite[React + Vite client]
  Vite -->|Axios requests| Express[Express API]
  Vite -->|Clerk browser SDK| Clerk[Clerk]
  Express -->|clerkMiddleware + protect| Clerk
  Clerk -->|Svix signed user events| ClerkWebhook[/POST /api/clerk/]
  ClerkWebhook --> Express
  Express -->|Mongoose| Mongo[(MongoDB Atlas: hotel-booking)]
  Express -->|Upload room images| Cloudinary[Cloudinary]
  Express -->|Create Checkout Session| Stripe[Stripe]
  Stripe -->|Signed payment events| StripeWebhook[/POST /api/stripe/]
  StripeWebhook --> Express
  Express -->|SMTP booking email| Brevo[Brevo SMTP]
```

## Module Responsibilities

### Client

```mermaid
flowchart LR
  App[client/src/App.jsx] --> Pages[pages/]
  App --> Components[components/]
  App --> Context[context/AppContext.jsx]
  Context --> Axios[Axios base URL]
  Context --> ClerkReact[Clerk React hooks]
  Pages --> Components
  Components --> Assets[assets/]
```

| Area       | Path                                | Responsibility                                                                                             |
| ---------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Entry      | `client/src/main.jsx`               | Creates React root and wraps the app with `ClerkProvider`, `BrowserRouter`, and `AppProvider`.             |
| Routes     | `client/src/App.jsx`                | Defines public, authenticated, loader, and owner routes.                                                   |
| State      | `client/src/context/AppContext.jsx` | Centralizes Clerk user/token access, axios base URL, room list, owner state, currency, and facility icons. |
| Pages      | `client/src/pages/`                 | Guest booking pages and owner dashboard pages.                                                             |
| Components | `client/src/components/`            | Shared UI for nav, cards, registration modal, owner layout, and visual sections.                           |
| Assets     | `client/src/assets/`                | Static images, icons, and asset exports.                                                                   |

### Server

```mermaid
flowchart LR
  Server[server/server.js] --> Routes[routes/]
  Routes --> Middleware[middleware/]
  Routes --> Controllers[controllers/]
  Controllers --> Models[models/]
  Controllers --> Configs[configs/]
  Configs --> Mongo[(MongoDB)]
  Configs --> Cloudinary[Cloudinary]
  Configs --> Brevo[Brevo SMTP]
  Controllers --> Stripe[Stripe]
```

| Area        | Path                                    | Responsibility                                                                                                 |
| ----------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Entry       | `server/server.js`                      | Connects MongoDB/Cloudinary, configures CORS, webhooks, JSON parsing, Clerk middleware, routers, and listener. |
| Routes      | `server/routes/`                        | Maps HTTP paths to controller functions.                                                                       |
| Middleware  | `server/middleware/authMiddleware.js`   | Resolves Clerk `req.auth.userId` to a Mongo `User` and attaches `req.user`.                                    |
| Uploads     | `server/middleware/uploadMiddleware.js` | Uses Multer disk storage for multipart room image uploads.                                                     |
| Controllers | `server/controllers/`                   | Implements user, hotel, room, booking, Stripe webhook, and Clerk webhook behavior.                             |
| Models      | `server/models/`                        | Mongoose schemas for `User`, `Hotel`, `Room`, and `Booking`.                                                   |
| Configs     | `server/configs/`                       | MongoDB connection, Cloudinary config, and Brevo SMTP transporter.                                             |

## Critical Flows

### Booking to Payment

```mermaid
sequenceDiagram
  autonumber
  participant Guest
  participant Client
  participant API
  participant Mongo
  participant Brevo
  participant Stripe

  Guest->>Client: Select room and dates
  Client->>API: POST /api/bookings/check-availability
  API->>Mongo: Find overlapping bookings for room
  Mongo-->>API: Existing bookings
  API-->>Client: { success, isAvailable }
  Guest->>Client: Confirm booking
  Client->>API: POST /api/bookings/book with Clerk token
  API->>Mongo: Re-check availability
  API->>Mongo: Read room and hotel
  API->>Mongo: Create Booking
  API->>Brevo: Send confirmation email
  API-->>Client: { success, message }
  Guest->>Client: Pay now
  Client->>API: POST /api/bookings/stripe-payment
  API->>Stripe: Create Checkout Session
  Stripe-->>API: Session URL
  API-->>Client: { success, url }
  Client->>Stripe: Redirect to Checkout
  Stripe->>API: POST /api/stripe signed event
  API->>Stripe: Verify signature and list Checkout Session
  API->>Mongo: Mark booking isPaid=true, paymentMethod=Stripe
  API-->>Stripe: { received: true }
```

Implementation sources:

- Booking controller: [server/controllers/bookingController.js](server/controllers/bookingController.js)
- Stripe webhook: [server/controllers/stripeWebhooks.js](server/controllers/stripeWebhooks.js)
- Booking model: [server/models/Booking.js](server/models/Booking.js)

### User Sync

```mermaid
sequenceDiagram
  autonumber
  participant Clerk
  participant API
  participant Svix
  participant Mongo

  Clerk->>API: POST /api/clerk with svix-* headers
  API->>Svix: Verify JSON payload with CLERK_WEBHOOK_SECRET
  Svix-->>API: Verified event
  alt user.created
    API->>Mongo: User.create(userData)
  else user.updated
    API->>Mongo: User.findByIdAndUpdate(data.id, userData)
  else user.deleted
    API->>Mongo: User.findByIdAndDelete(data.id)
  end
  API-->>Clerk: { success, message }
```

Implementation source: [server/controllers/clerkWebhooks.js](server/controllers/clerkWebhooks.js)

### Room Creation

```mermaid
sequenceDiagram
  autonumber
  participant Owner
  participant Client
  participant API
  participant Multer
  participant Cloudinary
  participant Mongo

  Owner->>Client: Submit room form with images
  Client->>API: POST /api/rooms multipart/form-data
  API->>Multer: upload.array("images", 5)
  API->>Mongo: Find Hotel by owner Clerk user ID
  API->>Cloudinary: Upload each file path
  Cloudinary-->>API: secure_url values
  API->>Mongo: Room.create({ hotel, roomType, pricePerNight, amenities, images })
  API-->>Client: { success, message }
```

Implementation sources:

- Room route: [server/routes/roomRoutes.js](server/routes/roomRoutes.js)
- Upload middleware: [server/middleware/uploadMiddleware.js](server/middleware/uploadMiddleware.js)
- Room controller: [server/controllers/roomController.js](server/controllers/roomController.js)

## Data Model

```mermaid
erDiagram
  USER ||--o| HOTEL : owns
  HOTEL ||--o{ ROOM : contains
  USER ||--o{ BOOKING : makes
  HOTEL ||--o{ BOOKING : receives
  ROOM ||--o{ BOOKING : booked_for

  USER {
    string _id "Clerk user id"
    string username
    string email
    string image
    string role "user | hotelOwner"
    string[] recentSearchedCities
    date createdAt
    date updatedAt
  }

  HOTEL {
    objectId _id
    string name
    string address
    string contact
    string owner "ref User"
    string city
    date createdAt
    date updatedAt
  }

  ROOM {
    objectId _id
    string hotel "ref Hotel"
    string roomType
    number pricePerNight
    array amenities
    string[] images
    boolean isAvailable
    date createdAt
    date updatedAt
  }

  BOOKING {
    objectId _id
    string user "ref User"
    string room "ref Room"
    string hotel "ref Hotel"
    date checkInDate
    date checkOutDate
    number totalPrice
    number guests
    string status "pending | confirmed | cancelled"
    string paymentMethod
    boolean isPaid
    date createdAt
    date updatedAt
  }
```

Schema sources:

- [server/models/User.js](server/models/User.js)
- [server/models/Hotel.js](server/models/Hotel.js)
- [server/models/Room.js](server/models/Room.js)
- [server/models/Booking.js](server/models/Booking.js)

## Request Pipeline

```mermaid
flowchart TD
  Incoming[HTTP request] --> CORS[cors()]
  CORS --> StripeCheck{Path is /api/stripe?}
  StripeCheck -->|yes| Raw[express.raw application/json]
  Raw --> StripeWebhook[stripeWebhooks]
  StripeCheck -->|no| JSON[express.json()]
  JSON --> ClerkMW[clerkMiddleware()]
  ClerkMW --> ClerkPath{Path is /api/clerk?}
  ClerkPath -->|yes| ClerkWebhook[clerkWebhooks]
  ClerkPath -->|no| Router[API router]
  Router --> Protect{Protected route?}
  Protect -->|yes| ProtectMW[protect middleware]
  ProtectMW --> Controller[controller]
  Protect -->|no| Controller
```

The Stripe webhook route is registered before `express.json()` so Stripe can verify the raw request body. Do not move it behind JSON parsing unless the webhook implementation changes accordingly.

## Known Limitations

- CORS is currently permissive through `app.use(cors())`.
- No automated tests exist yet.
- No server lint command exists yet.
- Public endpoints do not have rate limiting.
- Request bodies are trusted by controllers; schema validation is a future hardening task.
- Webhook handlers do not yet enforce idempotency for repeated provider deliveries.
- Booking conflict checks currently scan by date conditions without dedicated indexes.
- Some reference fields are typed as `String` even when they point at Mongo ObjectIds; future model cleanup should be planned carefully with migration testing.

## Future Evolution

- Add indexes for booking conflict checks and dashboard queries.
- Add controller tests with mocked provider clients and integration tests with a test MongoDB.
- Add server-side validation using a schema library.
- Add webhook event deduplication keyed by provider event IDs.
- Restrict CORS by environment.
- Move email and payment post-processing to a queue if traffic grows.
- Add observability: structured logs, request IDs, and provider webhook audit logs.
