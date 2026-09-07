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
- [Project Structure](#project-structure)

## Overview

An org registers on the platform, lists the pets available for adoption at
its address, and interested adopters browse pets by city and contact the org
directly via WhatsApp. Managing pets (registering one, marking it as
adopted) requires the org to be authenticated — and only the org that owns a
pet can update it.

## Features

- Register a pet
- List all pets available for adoption in a given city
- Filter pets by characteristics (age, size, type)
- View details of a specific pet
- Register an org
- Org login (JWT-based session)

## Business Rules

- City is required to list pets
- An org must always have an address and a WhatsApp number
- Every pet must be linked to an org
- Interested adopters contact the org directly via WhatsApp (the pet's
  detail response includes the owning org's WhatsApp number)
- All pet filters except city are optional
- An org must be authenticated to perform administrative actions
  (registering a pet, updating its adoption status)
- Only the org that registered a pet can update its adoption status

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
  can't use the response to tell which one was incorrect.
- **No internal error leakage**: unexpected failures (e.g. a database
  outage) always return a generic `500` — stack traces, ORM error messages
  and file paths never reach the client.
- Sensitive fields (`password_hash`) are always stripped before a response
  is sent, on every endpoint that returns org data.

## API Reference

Base routes are prefixed with `/orgs` and `/pets`.

| Method  | Endpoint             | Auth required | Description                                   |
| ------- | --------------------- | :-----------: | ---------------------------------------------- |
| `POST`  | `/orgs`               |      No       | Register a new org (auto-login: returns a token) |
| `POST`  | `/orgs/sessions`      |      No       | Authenticate an org (login)                   |
| `GET`   | `/orgs/:id`           |      No       | Get an org's public details (name, address, WhatsApp) |
| `PATCH` | `/orgs/:id`           |    **Yes**    | Update the authenticated org's own information (owner only; email and password can't be changed here) |
| `POST`  | `/pets`               |    **Yes**    | Register a pet for the authenticated org      |
| `GET`   | `/pets/:id`           |      No       | Get a pet's details, including the owning org's WhatsApp |
| `PATCH` | `/pets/:id`           |    **Yes**    | Update a pet's mutable information (owner org only; adoption status can't be changed here) |
| `GET`   | `/pets/search`        |      No       | List pets by city, with optional filters (`age`, `size`, `type`) and pagination (`page`) |
| `PATCH` | `/pets/:id/adopt`     |    **Yes**    | Mark a pet as adopted/available (owner org only) |

**Example — search**: `GET /pets/search?city=São Paulo&page=1&size=Small&type=Dog`

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
                              adopted       Boolean
1 ── * (an org has many pets)
```

## Testing

The project has **106 automated tests** across **18 test files**, split into:

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
```

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
├── lib/                   # Prisma client singleton
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
