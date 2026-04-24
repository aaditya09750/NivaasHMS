<!-- markdownlint-disable MD013 MD033 -->

# API Reference

Source of truth: [server/routes](../server/routes) and [server/controllers](../server/controllers).

- Base URL: `http://localhost:3000` locally, or `VITE_BACKEND_URL` from the client.
- Protected endpoints expect `Authorization: Bearer <Clerk session token>`.
- Most controller failures return HTTP `200` with `{ "success": false, "message": "..." }`. Stripe signature failures return HTTP `400`.
- Examples use `BASE_URL=http://localhost:3000` and `TOKEN=<clerk-session-token>`.

```bash
BASE_URL=http://localhost:3000
TOKEN=<clerk-session-token>
```

## Health

### `GET /`

Public health check.

```bash
curl "$BASE_URL/"
```

Response:

```text
API is working
```

## Users

### `GET /api/user`

Fetch the current Mongo user role and recent searched cities. The user is resolved by Clerk ID in `protect`.

Auth: Clerk session token.

```bash
curl "$BASE_URL/api/user" \
  -H "Authorization: Bearer $TOKEN"
```

Success response:

```json
{
  "success": true,
  "role": "user",
  "recentSearchedCities": ["Mumbai", "Pune"]
}
```

Error cases:

- Missing Clerk user ID: `{ "success": false, "message": "not authenticated" }`
- Controller exception: `{ "success": false, "message": "<error message>" }`

### `POST /api/user/store-recent-search`

Store one searched city for the current user. The controller keeps at most 3 entries by shifting the oldest value.

Auth: Clerk session token.

Request body:

```json
{
  "recentSearchedCity": "Mumbai"
}
```

```bash
curl -X POST "$BASE_URL/api/user/store-recent-search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recentSearchedCity":"Mumbai"}'
```

Success response:

```json
{
  "success": true,
  "message": "City added"
}
```

Error cases:

- Missing Clerk user ID: `{ "success": false, "message": "not authenticated" }`
- Save or request parsing failure: `{ "success": false, "message": "<error message>" }`

## Hotels

### `POST /api/hotels`

Register a hotel for the current user. A user can register only one hotel. On success, the user role is updated to `hotelOwner`.

Auth: Clerk session token.

Request body:

```json
{
  "name": "Nivaas Residency",
  "address": "MG Road",
  "contact": "+91 9876543210",
  "city": "Pune"
}
```

```bash
curl -X POST "$BASE_URL/api/hotels" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Nivaas Residency","address":"MG Road","contact":"+91 9876543210","city":"Pune"}'
```

Success response:

```json
{
  "success": true,
  "message": "Hotel Registered Successfully"
}
```

Error cases:

- Existing hotel for user: `{ "success": false, "message": "Hotel Already Registered" }`
- Missing Clerk user ID: `{ "success": false, "message": "not authenticated" }`
- Validation or database failure: `{ "success": false, "message": "<error message>" }`

## Rooms

### `POST /api/rooms`

Create a room for the current owner's hotel. Images are uploaded through Multer using field name `images`, capped at 5 files by the route. Each uploaded file is then sent to Cloudinary and stored as a secure URL.

Auth: Clerk session token.

Content type: `multipart/form-data`.

Form fields:

| Field           | Type          | Required | Notes                                                  |
| --------------- | ------------- | -------- | ------------------------------------------------------ |
| `roomType`      | string        | Yes      | Example: `Single`, `Double`, `Deluxe`.                 |
| `pricePerNight` | number/string | Yes      | Coerced with unary `+`.                                |
| `amenities`     | JSON string   | Yes      | Parsed with `JSON.parse`, for example `["Free WiFi"]`. |
| `images`        | file[]        | No       | Up to 5 files.                                         |

```bash
curl -X POST "$BASE_URL/api/rooms" \
  -H "Authorization: Bearer $TOKEN" \
  -F 'roomType=Deluxe' \
  -F 'pricePerNight=120' \
  -F 'amenities=["Free WiFi","Room Service"]' \
  -F "images=@./room-1.jpg" \
  -F "images=@./room-2.jpg"
```

Success response:

```json
{
  "success": true,
  "message": "Room created successfully"
}
```

Error cases:

- No hotel found for owner: `{ "success": false, "message": "No Hotel found" }`
- Invalid `amenities` JSON, upload failure, or database failure: `{ "success": false, "message": "<error message>" }`

### `GET /api/rooms`

List rooms where `isAvailable` is `true`, newest first. Each room populates `hotel`, and the hotel owner image is selected through nested population.

Auth: Public.

```bash
curl "$BASE_URL/api/rooms"
```

Success response:

```json
{
  "success": true,
  "rooms": [
    {
      "_id": "<room-id>",
      "hotel": {
        "_id": "<hotel-id>",
        "name": "Nivaas Residency",
        "address": "MG Road",
        "contact": "+91 9876543210",
        "owner": {
          "_id": "<clerk-user-id>",
          "image": "https://..."
        },
        "city": "Pune"
      },
      "roomType": "Deluxe",
      "pricePerNight": 120,
      "amenities": ["Free WiFi", "Room Service"],
      "images": ["https://res.cloudinary.com/..."],
      "isAvailable": true
    }
  ]
}
```

Error case:

- Query failure: `{ "success": false, "message": "<error message>" }`

### `GET /api/rooms/owner`

List rooms for the hotel owned by the current Clerk user.

Auth: Clerk session token.

```bash
curl "$BASE_URL/api/rooms/owner" \
  -H "Authorization: Bearer $TOKEN"
```

Success response:

```json
{
  "success": true,
  "rooms": [
    {
      "_id": "<room-id>",
      "hotel": {
        "_id": "<hotel-id>",
        "name": "Nivaas Residency"
      },
      "roomType": "Deluxe",
      "pricePerNight": 120,
      "amenities": ["Free WiFi"],
      "images": ["https://..."],
      "isAvailable": true
    }
  ]
}
```

Error cases:

- Missing Clerk user ID: `{ "success": false, "message": "not authenticated" }`
- Missing owner hotel or query failure: `{ "success": false, "message": "<error message>" }`

### `POST /api/rooms/toggle-availability`

Flip a room's `isAvailable` value.

Auth: Clerk session token.

Request body:

```json
{
  "roomId": "<room-id>"
}
```

```bash
curl -X POST "$BASE_URL/api/rooms/toggle-availability" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roomId":"<room-id>"}'
```

Success response:

```json
{
  "success": true,
  "message": "Room availability Updated"
}
```

Error cases:

- Missing Clerk user ID: `{ "success": false, "message": "not authenticated" }`
- Missing or invalid room ID: `{ "success": false, "message": "<error message>" }`

## Bookings

### `POST /api/bookings/check-availability`

Check whether a room has no overlapping bookings for the provided date range.

Auth: Public.

Request body:

```json
{
  "room": "<room-id>",
  "checkInDate": "2026-05-01",
  "checkOutDate": "2026-05-03"
}
```

```bash
curl -X POST "$BASE_URL/api/bookings/check-availability" \
  -H "Content-Type: application/json" \
  -d '{"room":"<room-id>","checkInDate":"2026-05-01","checkOutDate":"2026-05-03"}'
```

Success response:

```json
{
  "success": true,
  "isAvailable": true
}
```

Error case:

- Query or request failure: `{ "success": false, "message": "<error message>" }`

### `POST /api/bookings/book`

Create a booking for the current user. The controller re-checks availability, calculates nights from `checkInDate` and `checkOutDate`, stores the booking, and sends a Brevo SMTP confirmation email.

Auth: Clerk session token.

Request body:

```json
{
  "room": "<room-id>",
  "checkInDate": "2026-05-01",
  "checkOutDate": "2026-05-03",
  "guests": 2
}
```

```bash
curl -X POST "$BASE_URL/api/bookings/book" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"room":"<room-id>","checkInDate":"2026-05-01","checkOutDate":"2026-05-03","guests":2}'
```

Success response:

```json
{
  "success": true,
  "message": "Booking created successfully"
}
```

Error cases:

- Room unavailable: `{ "success": false, "message": "Room is not available" }`
- Missing Clerk user ID: `{ "success": false, "message": "not authenticated" }`
- Booking, lookup, or email failure: `{ "success": false, "message": "Failed to create booking" }`

### `GET /api/bookings/user`

List bookings for the current user, newest first, with `room` and `hotel` populated.

Auth: Clerk session token.

```bash
curl "$BASE_URL/api/bookings/user" \
  -H "Authorization: Bearer $TOKEN"
```

Success response:

```json
{
  "success": true,
  "bookings": [
    {
      "_id": "<booking-id>",
      "user": "<clerk-user-id>",
      "room": { "_id": "<room-id>", "roomType": "Deluxe" },
      "hotel": { "_id": "<hotel-id>", "name": "Nivaas Residency" },
      "checkInDate": "2026-05-01T00:00:00.000Z",
      "checkOutDate": "2026-05-03T00:00:00.000Z",
      "totalPrice": 240,
      "guests": 2,
      "status": "pending",
      "paymentMethod": "Pay At Hotel",
      "isPaid": false
    }
  ]
}
```

Error cases:

- Missing Clerk user ID: `{ "success": false, "message": "not authenticated" }`
- Query failure: `{ "success": false, "message": "Failed to fetch bookings" }`

### `GET /api/bookings/hotel`

Return owner dashboard data for the current user's hotel.

Auth: Clerk session token.

```bash
curl "$BASE_URL/api/bookings/hotel" \
  -H "Authorization: Bearer $TOKEN"
```

Success response:

```json
{
  "success": true,
  "dashboardData": {
    "totalBookings": 3,
    "totalRevenue": 720,
    "bookings": [
      {
        "_id": "<booking-id>",
        "room": { "_id": "<room-id>", "roomType": "Deluxe" },
        "hotel": { "_id": "<hotel-id>", "name": "Nivaas Residency" },
        "user": { "_id": "<clerk-user-id>", "username": "Ada Lovelace" },
        "totalPrice": 240,
        "isPaid": false
      }
    ]
  }
}
```

Error cases:

- No hotel for current owner: `{ "success": false, "message": "No Hotel found" }`
- Missing Clerk user ID: `{ "success": false, "message": "not authenticated" }`
- Query failure: `{ "success": false, "message": "Failed to fetch bookings" }`

### `POST /api/bookings/stripe-payment`

Create a Stripe Checkout Session for an existing booking. The controller reads `Origin` to build success and cancel URLs.

Auth: Clerk session token.

Request body:

```json
{
  "bookingId": "<booking-id>"
}
```

```bash
curl -X POST "$BASE_URL/api/bookings/stripe-payment" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"<booking-id>"}'
```

Success response:

```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/..."
}
```

Error cases:

- Missing Clerk user ID: `{ "success": false, "message": "not authenticated" }`
- Missing booking, Stripe failure, or lookup failure: `{ "success": false, "message": "Payment Failed" }`

## Webhooks

Webhook endpoints are provider-to-server endpoints. Do not call them from the browser.

### `POST /api/stripe`

Stripe payment webhook. The route is registered before `express.json()` and uses `express.raw({ type: "application/json" })` so Stripe can verify the signature.

Auth: `stripe-signature` header verified with `STRIPE_WEBHOOK_SECRET`.

Handled event:

- `payment_intent.succeeded`: finds the Checkout Session for the payment intent, reads `metadata.bookingId`, and updates the booking with `{ isPaid: true, paymentMethod: "Stripe" }`.

Local testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe
```

Expected provider response:

```json
{
  "received": true
}
```

Error cases:

- Invalid Stripe signature: HTTP `400` with `Webhook Error: <message>`.
- Unhandled event type: logged by the server, then responds `{ "received": true }`.

### `POST /api/clerk`

Clerk user sync webhook. The controller verifies Svix headers against `CLERK_WEBHOOK_SECRET`.

Auth: `svix-id`, `svix-timestamp`, and `svix-signature` headers.

Handled events:

- `user.created`: creates a Mongo `User`.
- `user.updated`: updates the Mongo `User`.
- `user.deleted`: deletes the Mongo `User`.

Synced user data:

```json
{
  "_id": "data.id",
  "email": "data.email_addresses[0].email_address",
  "username": "data.first_name + ' ' + data.last_name",
  "image": "data.image_url"
}
```

Success response:

```json
{
  "success": true,
  "message": "Webhook Recieved"
}
```

Error case:

- Invalid signature or processing failure: `{ "success": false, "message": "<error message>" }`

## Error Handling Notes

Current controllers use a project-wide JSON pattern:

```json
{
  "success": false,
  "message": "Human readable message"
}
```

The project does not yet have centralized validation or HTTP status mapping. Client code should check `data.success` before trusting response payloads.
