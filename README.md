# Mitra Calling App — Backend

Node.js + Express + TypeScript + MongoDB backend for the Mitra app. It serves two client apps against one backend:

- **User app** — customers who browse, chat with, send gifts to, and call Partners (coin wallet).
- **Partner app** — the people who get called. They verify their identity, go online/offline, chat, accept/decline calls, and track fixed daily pay + gift bonus (settled in person, no in-app withdrawal).

## Tech stack

- Node.js, Express 5, TypeScript
- MongoDB with Mongoose
- JWT auth (role-scoped: `user` / `partner`)
- Socket.io for real-time chat and call signaling
- Multer for partner ID/selfie uploads (served from `/uploads`)
- Swagger (OpenAPI) docs via `swagger-jsdoc` + `swagger-ui-express`

## Setup

```bash
npm install
cp .env.example .env   # adjust values if needed
npm run dev
```

Requires a running MongoDB instance (default: `mongodb://localhost:27017/mitra_calling_app`).

## Environment variables (`.env`)

| Variable          | Description                                         | Default                                      |
|-------------------|------------------------------------------------------|-----------------------------------------------|
| `PORT`            | HTTP port                                             | `5000`                                        |
| `MONGODB_URI`      | MongoDB connection string                             | `mongodb://localhost:27017/mitra_calling_app` |
| `JWT_SECRET`       | Secret used to sign JWTs                              | —                                              |
| `JWT_EXPIRES_IN`    | JWT expiry                                            | `30d`                                         |
| `ADMIN_API_KEY`     | Shared key required in `x-admin-key` for admin routes | —                                              |

## Scripts

| Command              | Description                                   |
|----------------------|------------------------------------------------|
| `npm run dev`         | Start the server in watch mode (tsx)           |
| `npm run start:dev`   | Same as `dev`                                  |
| `npm run build`       | Compile TypeScript to `dist/`                  |
| `npm start`           | Run the compiled server (`dist/server.js`)      |

## API docs

Once the server is running, there are two separate interactive Swagger pages — one per client app:

```
http://localhost:5000/user/api-docs     # auth, discover, chats, coins, calls
http://localhost:5000/partner/api-docs  # partner auth/profile/verification/availability/chats/calls/earnings + admin
```

Get a JWT via `POST /api/auth/guest` (user) or `POST /api/partners/auth/otp/verify` (partner), then click **Authorize** on the matching Swagger page and paste the token to try protected endpoints. Admin routes (on the partner docs page) use the `x-admin-key` header instead of a JWT.

## API overview

All routes are prefixed with `/api`.

**User-facing**
- **Auth** — `POST /auth/guest`, `POST /auth/otp/request`, `POST /auth/otp/verify`
- **Users** — `GET/PATCH /users/me`, `GET /users/:id`
- **Discover** — `GET /discover` (approved partners), `POST /discover/:partnerId/favorite`, `POST /discover/:partnerId/say-hello`, `POST /discover/:partnerId/gift`
- **Chats** — `GET /chats`, `GET/POST /chats/:conversationId/messages` (also pushed in real time over Socket.io)
- **Coins** — `GET /coins/balance`, `GET /coins/packages`, `POST /coins/purchase`, `GET /coins/transactions`
- **Calls** — `POST /calls/start`, `POST /calls/:callId/end`, `GET /calls/history`

**Partner-facing** (`/api/partners/*`)
- **Auth** — `POST /partners/auth/otp/request`, `POST /partners/auth/otp/verify`
- **Profile** — `GET/PATCH /partners/me`, `POST /partners/verification` (multipart: `idType`, `idImage`, `selfieImage`), `POST /partners/availability`
- **Earnings** — `GET /partners/dashboard` (today's numbers), `GET /partners/payout?date=YYYY-MM-DD`, `GET /partners/gifts`
- **Chats** — `GET /partners/chats`, `GET/POST /partners/chats/:conversationId/messages` (same conversations as the user side, mirrored for the partner's auth)
- **Calls** — `POST /partners/calls/:callId/respond` (accept/decline), `POST /partners/calls/:callId/end`, `GET /partners/calls/history`

**Admin** (`x-admin-key` header, no JWT)
- `GET /admin/partners/pending`, `POST /admin/partners/:id/approve`, `POST /admin/partners/:id/reject`

## How the pieces fit together

- A **User** calls/chats/gifts a **Partner** — they're different Mongo collections with separate JWTs (`role: "user"` vs `role: "partner"` in the token), so a user's token can't hit partner-only routes and vice versa.
- A **Partner** only shows up in Discover once `verificationStatus` is `approved` (submit via `/partners/verification`, approve via the admin endpoints — there's no admin UI yet, just these endpoints).
- Going online (`POST /partners/availability`) the first time in a calendar day creates an `Attendance` row with a fixed daily pay amount (₹500, see `PARTNER_FIXED_DAILY_PAY` in `src/config/gifts.ts`).
- **Calls** go through a request lifecycle: `pending` (ringing, pushed via `call:incoming`) → partner `respond`s → `ongoing` or `declined` → `completed` on end. Billing (20 coins/minute from the user's wallet) only happens for time between accept and end.
- **Gifts** (`src/config/gifts.ts`) are spent from the user's coin wallet; 50% of the coin cost is credited to the partner's gift-bonus ledger (`PartnerTransaction`), which only ever grows — there's no partner-side spend/withdraw, matching "settled in person" from the UI.
- Partner KPIs/payout are computed on the fly from `CallLog` + `PartnerTransaction` + `Attendance` for a given day, not stored as a running total.

## Real-time events (Socket.io)

Connect to the same host/port as the HTTP server, authenticating with a JWT from either app:

```js
const socket = io("http://localhost:5000", { auth: { token: "<jwt>" } });
```

Each socket auto-joins a personal room scoped to its role, so events arrive regardless of which screen is open.

| Event (client → server) | Payload                    | Ack response                 |
|--------------------------|-----------------------------|--------------------------------|
| `message:send`            | `{ conversationId, text }`  | `{ message }` or `{ error }`   |

| Event (server → client) | Payload                                              |
|--------------------------|--------------------------------------------------------|
| `message:new`              | `{ conversationId, message }` — sent to both sides of a conversation |
| `call:incoming`            | `{ callId, type, caller }` — sent to the partner when a user calls |
| `call:accepted`            | `{ callId }` — sent to the user when the partner accepts |
| `call:declined`            | `{ callId }` — sent to the user when the partner declines |
| `call:ended`               | `{ callId, durationSeconds? }` — sent to both sides when the call ends |

Sending a message via REST also triggers a `message:new` push to connected sockets, so REST and Socket.io stay in sync. The call events are *only* pushed over Socket.io — the REST endpoints are what actually start/accept/decline/end a call.

## File uploads

Partner ID + selfie images are uploaded via `POST /partners/verification` (multipart/form-data) and stored on local disk under `uploads/partners/`, served statically at `/uploads/partners/<filename>`. Not suitable for a multi-instance deployment as-is (local disk only) — swap for S3/Cloud Storage if you scale beyond one server.

## Project structure

```
src/
  config/       # DB connection, coin packages, gifts catalog, multer upload config
  controllers/  # Route handlers
  middleware/   # Auth guard (user/partner/admin), error handling
  models/       # Mongoose schemas
  routes/       # Express routers + OpenAPI JSDoc annotations
  services/     # Shared business logic (chat, OTP — used by REST + sockets, user + partner)
  sockets/      # Socket.io setup and handlers
  swagger/      # Separate user/partner Swagger specs + shared schema components
  types/        # Express type augmentation
  utils/        # JWT helpers, async handler, HttpError
  server.ts     # App entry point
```
