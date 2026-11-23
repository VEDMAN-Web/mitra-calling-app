# Mitra Calling App — Backend

Node.js + Express + TypeScript + MongoDB backend for the Mitra app (auth, discover, chat, coin wallet, calls).

## Tech stack

- Node.js, Express 5, TypeScript
- MongoDB with Mongoose
- JWT auth
- Swagger (OpenAPI) docs via `swagger-jsdoc` + `swagger-ui-express`

## Setup

```bash
npm install
cp .env.example .env   # adjust values if needed
npm run dev
```

Requires a running MongoDB instance (default: `mongodb://localhost:27017/mitra_calling_app`).

## Environment variables (`.env`)

| Variable          | Description                              | Default                                      |
|-------------------|-------------------------------------------|-----------------------------------------------|
| `PORT`            | HTTP port                                 | `5000`                                        |
| `MONGODB_URI`      | MongoDB connection string                 | `mongodb://localhost:27017/mitra_calling_app` |
| `JWT_SECRET`       | Secret used to sign JWTs                  | —                                              |
| `JWT_EXPIRES_IN`    | JWT expiry                                | `30d`                                         |

## Scripts

| Command              | Description                                   |
|----------------------|------------------------------------------------|
| `npm run dev`         | Start the server in watch mode (tsx)           |
| `npm run start:dev`   | Same as `dev`                                  |
| `npm run build`       | Compile TypeScript to `dist/`                  |
| `npm start`           | Run the compiled server (`dist/server.js`)      |

## API docs

Once the server is running, interactive Swagger docs are available at:

```
http://localhost:5000/api-docs
```

Get a JWT via `POST /api/auth/guest` (or the OTP flow), then click **Authorize** in Swagger UI and paste the token to try protected endpoints.

## API overview

All routes are prefixed with `/api`.

- **Auth** — `POST /auth/guest`, `POST /auth/otp/request`, `POST /auth/otp/verify`
- **Users** — `GET/PATCH /users/me`, `GET /users/:id`
- **Discover** — `GET /discover`, `POST /discover/:userId/favorite`, `POST /discover/:userId/say-hello`
- **Chats** — `GET /chats`, `GET/POST /chats/:conversationId/messages`
- **Coins** — `GET /coins/balance`, `GET /coins/packages`, `POST /coins/purchase`, `GET /coins/transactions`
- **Calls** — `POST /calls/start`, `POST /calls/:callId/end`, `GET /calls/history`

Calls are billed at 20 coins/minute; text chat is free. Coin purchases are simulated (no real payment is processed).

## Project structure

```
src/
  config/       # DB connection, coin package definitions
  controllers/  # Route handlers
  middleware/   # Auth guard, error handling
  models/       # Mongoose schemas
  routes/       # Express routers + OpenAPI JSDoc annotations
  types/        # Express type augmentation
  utils/        # JWT helpers, async handler, HttpError
  server.ts     # App entry point
  swagger.ts    # Swagger spec setup
```
