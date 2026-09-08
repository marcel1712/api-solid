# FindAFriend API

A REST API for a pet adoption platform, connecting animal shelters/NGOs
("orgs") with people looking to adopt. Built with **Fastify**, **TypeScript**,
**Prisma** and **PostgreSQL**, following **SOLID** principles and a
**layered architecture** (controllers → use cases → repositories) that keeps
business rules fully decoupled from the HTTP and database layers.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Business Rules](#business-rules)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Security](#security)
- [API Reference](#api-reference)
- [Data Model](#data-model)
- [Testing](#testing)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

## Overview

An org registers on the platform, lists the pets available for adoption at
its address, and interested adopters browse pets by city and contact the org
directly via WhatsApp. Managing pets (registering one, marking it as
adopted) requires the org to be authenticated — and only the org that owns a
pet can update it.

## Features

- Register a pet
- Upload up to 3 photos per pet, stored on Cloudflare R2
- List all pets available for adoption in a given city
- Filter pets by characteristics (age, size, type)
- View details of a specific pet
- Register an org
- Org login (JWT-based session)

## Business Rules

- City is required to list pets
- An org must always have an address and a WhatsApp number, stored as
  E.164 (`+5511989731163`). The client can send a bare Brazilian local
  number (`11989731163`), a formatted one (`(11) 98973-1163`), or one
  already carrying the `55` country code — `POST /orgs` and
  `PATCH /orgs/:id` normalize it to E.164 before validating/storing it.
  A number that already starts with `+` (any country) is left as-is.
- Every pet must be linked to an org
- Interested adopters contact the org directly via WhatsApp (the pet's
  detail response includes the owning org's WhatsApp number)
- All pet filters except city are optional
- An org must be authenticated to perform administrative actions
  (registering a pet, updating its adoption status)
- Only the org that registered a pet can update its adoption status
- A pet can have at most 3 images; only the owning org can upload or remove them
- An org must verify its email (link sent on registration) before it can
  log in — registration itself still returns a working session token, so
  the newly registered org isn't locked out of its own account while
  waiting for the email

## Tech Stack

| Layer          | Technology                                      |
| -------------- | ------------------------------------------------ |
| Runtime        | Node.js, TypeScript (strict mode)                |
| HTTP framework | [Fastify](https://fastify.dev)                   |
| Database       | PostgreSQL                                       |
| ORM            | [Prisma](https://www.prisma.io)                  |
| Validation     | [Zod](https://zod.dev)                           |
| Auth           | JSON Web Tokens (`jsonwebtoken`), `@fastify/cookie` |
| Password hashing | bcrypt                                         |
| Testing        | [Vitest](https://vitest.dev) (unit + e2e)        |
| Linting        | ESLint + typescript-eslint                       |
| Object storage | Cloudflare R2 (S3-compatible)                    |
| Transactional email | [Resend](https://resend.com)               |
| Local infra    | Docker Compose (PostgreSQL)                      |

## Architecture

The codebase follows a **layered architecture** inspired by SOLID and the
Repository pattern, which keeps the domain logic testable and independent
from any specific framework or database:

```
HTTP request
   │
   ▼
Controller        (src/http/controllers)   — parses/validates input (Zod), calls a use case, shapes the HTTP response
   │
   ▼
Use Case           (src/use-cases)          — business rules, framework-agnostic
   │
   ▼
Repository         (src/repositories)       — data access, abstracted behind an interface
   │
   ▼
Prisma / PostgreSQL   or   In-Memory (tests)
```

- **Repository interfaces** (`org-repository.ts`, `pet-repository.ts`) decouple
  use cases from Prisma. Each has two implementations: a `PrismaXRepository`
  for production and an `InMemoryXRepository` used in unit tests — so
  business rules are tested without touching a real database.
- **Factories** (`src/use-cases/factories`) wire a use case to its concrete
  (Prisma) repository, keeping controllers free of instantiation logic —
  dependency injection without a DI framework.
- **Centralized error handling**: use cases throw typed domain errors
  (`ResourceNotFoundError`, `NotAllowedError`, `InvalidCredentialsError`,
  `ResourceAlreadyExistsError`), and a single Fastify error handler
  (`src/http/error-handler.ts`) maps each type to the right HTTP status. This
  means every controller stays a thin, linear function — no repeated
  try/catch or status-code logic to maintain.
- **Direct-to-storage uploads**: pet images never pass through the API
  server. `POST /pets/:id/images` returns a short-lived pre-signed URL
  (`@aws-sdk/s3-request-presigner`) that the client uses to `PUT` the file
  straight to Cloudflare R2, keeping the backend stateless with respect to
  binary data and avoiding memory/bandwidth pressure on the server.
- **No orphaned image records**: nothing is written to the database when
  an upload URL is requested. `POST /pets/:id/images/confirm` only
  persists the `PetImage` row after verifying, with a `HeadObjectCommand`,
  that the object actually landed in R2 — so a cancelled upload, a dropped
  connection or an expired URL never leaves a broken image behind.
- **Mailer abstraction**: `Mailer` is an interface (`src/lib/mailer.ts`)
  implemented by `ResendMailer`, so password-reset emails go through the
  same repository-style seam as the rest of the app — easy to swap
  providers or fake in tests without touching use cases.

## Security

- **Password hashing** with bcrypt — plaintext passwords are never stored.
- **JWT-based sessions**: login issues a short-lived access token plus an
  `httpOnly`, `SameSite` refresh cookie (never exposed to client-side JS).
- **Route-level authorization** via a `verifyJwt` middleware, applied only to
  the routes that mutate data (`POST /pets`, `PATCH /pets/:id`,
  `PATCH /pets/:id/adopt`, `PATCH /orgs/:id`) — read endpoints stay public
  so anyone can browse pets.
- **Resource ownership checks**: the org id used to create/update a pet
  always comes from the verified JWT, never from the request body, and
  `UpdatePetUseCase`/`MarkPetAsAdoptedUseCase`/`UpdateOrgUseCase` reject the
  update (`403`) if the authenticated org isn't the owner of the resource
  being changed.
- **Restricted mutable fields**: `PATCH /orgs/:id` only accepts `name`,
  `whatsapp`, `city` and `address` (email and password are never
  updatable through this route), and `PATCH /pets/:id` only accepts
  `name`, `age`, `size`, `type` and `bio` — adoption status has its own
  dedicated route so it can't be changed as a side effect.
- **No user enumeration**: login returns the exact same generic error
  whether the email doesn't exist or the password is wrong — an attacker
  can't use the response to tell which one was incorrect. Password reset
  requests follow the same rule: `POST /orgs/password/forgot` always
  returns the same `200` response regardless of whether the email is
  registered.
- **Single-use, short-lived, hashed reset tokens**: a password reset token
  is a random 32-byte value, only its SHA-256 hash is stored in the
  database, it expires after 1 hour, is invalidated the moment it's used
  (or replaced by a newer request), and never reveals whether it was
  invalid because it expired, was already used, or never existed.
- **Email verification gate**: `AuthenticateOrgUseCase` rejects login
  (`403`) for an org that hasn't confirmed its email yet. Verification
  tokens follow the exact same single-use/hashed/short-lived pattern as
  password reset tokens (24h expiry instead of 1h).
- **No internal error leakage**: unexpected failures (e.g. a database
  outage) always return a generic `500` — stack traces, ORM error messages
  and file paths never reach the client.
- **Rate limiting** (`@fastify/cors` + `@fastify/rate-limit`): every route
  is capped at 100 requests/minute per IP by default, with stricter
  per-route limits on the endpoints most attractive to abuse —
  `POST /orgs` and `POST /orgs/password/forgot` (5/hour), `POST
  /orgs/sessions` (5/minute, brute-force protection), and `POST
  /orgs/password/reset` (10/hour). Disabled when `NODE_ENV=test` so the
  test suite isn't affected. Requires `trustProxy: true` (set on the
  Fastify instance) to key limits by the real client IP behind Render's
  proxy instead of the proxy's own IP.
- Sensitive fields (`password_hash`) are always stripped before a response
  is sent, on every endpoint that returns org data.

## API Reference

Base routes are prefixed with `/orgs` and `/pets`.

| Method  | Endpoint             | Auth required | Description                                   |
| ------- | --------------------- | :-----------: | ---------------------------------------------- |
| `POST`  | `/orgs`               |      No       | Register a new org (auto-login: returns a token; sends a verification email) |
| `POST`  | `/orgs/sessions`      |      No       | Authenticate an org (login; requires a verified email) |
| `GET`   | `/orgs/verify-email`  |      No       | Confirm the org's email using the token from the verification email |
| `POST`  | `/orgs/verify-email/resend` |  No     | Request a new verification email (always returns the same generic response) |
| `POST`  | `/orgs/password/forgot` |    No       | Request a password reset email (always returns the same generic response) |
| `POST`  | `/orgs/password/reset`  |    No       | Reset the password using a valid token from the reset email |
| `GET`   | `/orgs/:id`           |      No       | Get an org's public details (name, address, WhatsApp) |
| `PATCH` | `/orgs/:id`           |    **Yes**    | Update the authenticated org's own information (owner only; email and password can't be changed here) |
| `GET`   | `/orgs/me/pets`       |    **Yes**    | List the authenticated org's own pets, paginated, including adopted ones |
| `POST`  | `/pets`               |    **Yes**    | Register a pet for the authenticated org      |
| `GET`   | `/pets/:id`           |      No       | Get a pet's details, including the owning org's WhatsApp |
| `PATCH` | `/pets/:id`           |    **Yes**    | Update a pet's mutable information (owner org only; adoption status can't be changed here) |
| `GET`   | `/pets/search`        |      No       | List available (non-adopted) pets by city, with optional filters (`ageMin`, `ageMax`, `size`, `type`) and pagination (`page`). Each pet includes the owning org's `whatsapp` and its `images` |
| `PATCH` | `/pets/:id/adopt`     |    **Yes**    | Mark a pet as adopted/available (owner org only) |
| `POST`  | `/pets/:id/images`    |    **Yes**    | Request a pre-signed upload URL for a new pet image (owner org only, max 3 per pet) |
| `POST`  | `/pets/:id/images/confirm` | **Yes** | Confirm a completed upload, turning it into a persisted image |
| `DELETE`| `/pets/:id/images/:imageId` | **Yes** | Delete one of the pet's images (owner org only) |

**Example — search**: `GET /pets/search?city=São Paulo&page=1&size=Small&type=Dog&ageMin=0&ageMax=2`

`age` is stored and returned in **years**. Already-adopted pets are excluded from search results automatically.

**Image upload flow** (3 steps, nothing is persisted until step 3 succeeds):
1. `POST /pets/:id/images` with `{ "contentType": "image/jpeg" }` (also
   accepts `image/png`/`image/webp`) → returns `{ key, url, uploadUrl }`.
2. The client `PUT`s the raw file bytes directly to `uploadUrl` (valid for
   5 minutes) — the file never touches the API server.
3. `POST /pets/:id/images/confirm` with `{ "key": "<key from step 1>" }` →
   the backend checks the object actually exists in R2 and only then
   creates the `PetImage` row, returning it (including its `id` and `url`).

**Password reset flow**:
1. `POST /orgs/password/forgot` with `{ "email": "..." }` → always `200`.
   If the email is registered, an email is sent (via Resend) with a link
   to `${FRONTEND_URL}/reset-password?token=<token>`.
2. `POST /orgs/password/reset` with `{ "token": "...", "password": "..." }`
   → validates the token (unexpired, unused, exists), updates the
   password, and invalidates the token.

**Email verification flow**:
1. On `POST /orgs`, right after the org is created, an email is sent
   (via Resend) with a link to
   `${FRONTEND_URL}/verify-email?token=<token>`. A failure to send this
   email doesn't fail the registration request.
2. `GET /orgs/verify-email?token=...` → validates the token and marks the
   org's email as verified. `POST /orgs/sessions` rejects login with
   `403` until this step is done. Re-visiting an already-used link
   (e.g. a corporate email scanner prefetching it before the person
   clicks) returns `200`, not an error — the token is only rejected if
   it was never successfully used and has expired.
3. `POST /orgs/verify-email/resend` with `{ "email": "..." }` → sends a
   new verification email (invalidating any previous token) if the org
   exists and isn't verified yet. This is the recovery path for an
   expired link — without it, a missed 24h window would permanently
   lock the org out (can't log in, can't re-register with the same
   email).

## Data Model

```
Org                          Pet
─────────────────            ─────────────────
id            String (PK)    id            String (PK)
email         String (unique) name          String
password_hash String         orgId         String (FK → Org.id)
name          String         age           Int
whatsapp      String (unique) size          AnimalSize (Small | Medium | Large)
city          String         type          AnimalType (Dog | Cat | Bird | ...)
address       String         bio           String?
created_at    DateTime       created_at    DateTime
emailVerifiedAt DateTime?     adopted       Boolean

                              PetImage
                              ─────────────────
                              id            String (PK)
                              petId         String (FK → Pet.id)
                              key           String (R2 object key)
                              url           String (public URL)
                              created_at    DateTime

1 ── * (an org has many pets)      1 ── * (a pet has up to 3 images)
```

## Testing

The project has **203 automated tests** across **36 test files**, split into:

- **Unit tests** for every use case, running against the in-memory
  repositories — fast, no database required, cover business rules and edge
  cases (validation, ownership, not-found scenarios).
- **End-to-end tests** for every HTTP controller, running against a real
  PostgreSQL database via Fastify's `inject()` — cover the full
  request/response cycle, authentication, authorization and error responses.

```bash
npm test
```

## Getting Started

### Prerequisites

- Node.js
- Docker (for PostgreSQL)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env` and fill in the required values:

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5433/<db>"
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
PORT=3000
NODE_ENV=development
JWT_SECRET=

# Cloudflare R2 (S3-compatible object storage, used for pet images)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# Resend (transactional email, used for password reset)
RESEND_API_KEY=
MAIL_FROM="FindAFriend <onboarding@resend.dev>"
FRONTEND_URL="http://localhost:5173"
```

`R2_ACCOUNT_ID`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY` come from an
**Account API Token** created under R2 → Manage API Tokens (scoped to
`Object Read & Write` on a single bucket). `R2_PUBLIC_URL` is the bucket's
public development URL (R2 → bucket → Settings → Public Access) or a
connected custom domain.

`RESEND_API_KEY` comes from the Resend dashboard (API Keys). Without a
verified sending domain, Resend only allows `MAIL_FROM` to use its
`onboarding@resend.dev` sandbox address and restricts delivery to the
account owner's own email — verify a domain before relying on this in
production. `FRONTEND_URL` is used to build the link inside the
password-reset email (`${FRONTEND_URL}/reset-password?token=...`).

### 3. Start the database

```bash
docker compose up -d
```

### 4. Run database migrations

```bash
npx prisma migrate deploy
```

### 5. Start the dev server

```bash
npm run dev
```

### 6. Run the test suite

```bash
npm test
```

## Deployment

The API is deployed as a **Render** web service backed by a **Neon**
(serverless Postgres) database.

### 1. Database (Neon)

1. Create a project at [neon.tech](https://neon.tech) and copy its
   connection string — it already includes `?sslmode=require`, which
   `pg`/Prisma pick up automatically; don't strip it.
2. Use that string as `DATABASE_URL`. No manual migration step is needed:
   the `start` script runs `prisma migrate deploy` before booting the
   server, so every deploy keeps the schema in sync.

### 2. API (Render)

1. Create a **Web Service** from this repository.
2. **Build Command**: `npm install` (a `postinstall` hook runs
   `prisma generate` automatically).
3. **Start Command**: `npm start`.
4. Set every variable from `.env` (see [Configure environment
   variables](#2-configure-environment-variables)) in Render's
   Environment tab, with production values:
   - `DATABASE_URL` — the Neon connection string.
   - `NODE_ENV=production` — switches cookies to `secure: true` /
     `sameSite: "none"` (required for a cross-domain frontend) and
     suppresses verbose error logging.
   - `FRONTEND_URL` — the deployed frontend's origin. Used both to build
     the password-reset/verify-email links **and** as the allowed CORS
     origin, so it must be the exact origin the frontend is served
     from. Any trailing slash is stripped automatically (a browser's
     `Origin` header never has one, so a mismatched trailing slash on
     this value would silently break every cross-origin request).
   - `R2_PUBLIC_URL`, `RESEND_API_KEY`, etc. — same values as local dev,
     pointing at production resources.
   - Don't set `PORT` — Render injects it automatically and the app
     already binds to it.
5. The app listens on `0.0.0.0` (required for Render's network layer to
   reach it) and exposes `GET /` as a trivial health check.

### Notes

- **CORS** (`@fastify/cors`) only allows requests from `FRONTEND_URL`,
  with `credentials: true` so the refresh-token cookie can be sent, and
  `methods` explicitly set to `GET, HEAD, POST, PATCH, DELETE` — the
  plugin's own default is `GET, HEAD, POST` only, which would silently
  block every `PATCH`/`DELETE` request from a real browser (preflight
  would never allow them) even though `curl`/`app.inject()` never notice,
  since neither goes through a real preflight. Multiple frontend origins
  (e.g. a staging environment) aren't supported by a single string —
  extend `src/app.ts` to pass an array or function to `origin` if you
  need that.
- Redeploying re-runs `prisma migrate deploy`, which only applies
  pending migrations — it's safe to redeploy without new migrations.

## Project Structure

```
src/
├── env/                   # Environment variable validation (Zod)
├── http/
│   ├── controllers/       # One folder per resource (org, pet); *.spec.ts = e2e tests
│   ├── middlewares/       # verify-jwt (authentication)
│   ├── utils/             # JWT token generation
│   ├── error-handler.ts   # Centralized HTTP error mapping
│   └── routes.ts
├── lib/                   # Prisma client + R2 (S3) client singletons
├── repositories/
│   ├── prisma/            # Production repository implementations
│   └── in-memory/         # In-memory implementations used by unit tests
├── use-cases/
│   ├── errors/            # Typed domain errors
│   ├── factories/         # Dependency wiring for controllers
│   └── *.ts / *.spec.ts   # Business rules + unit tests
├── app.ts                 # Fastify instance, plugins, error handler
└── server.ts              # HTTP server bootstrap
```
