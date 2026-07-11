# Backend

A backend service for building dynamic forms, collecting submissions, and tracking analytics events. Built with Node.js, Express, TypeScript, PostgreSQL, and Prisma ORM.

## Project Structure

```
src/
  config/        env loading, Prisma client
  controllers/   request/response handling
  services/      business logic, database access
  models/        Zod validation schemas / DTOs
  middlewares/   API key auth, validation, error handling
  routes/        Express routers
  utils/         AppError, asyncHandler, API key generator
  app.ts         Express app setup
  server.ts      process entrypoint
prisma/
  schema.prisma  database schema
```

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and set `DATABASE_URL` for your PostgreSQL instance.
3. Generate the Prisma client and run migrations:
   ```
   npm run prisma:migrate
   ```
4. Start the dev server:
   ```
   npm run dev
   ```

The API runs on `http://localhost:4000` by default. Health check: `GET /health`.

## Authentication

All `/api/v1/forms` endpoints require an `x-api-key` header.

Issue a key first (no auth required — demo-only endpoint, lock this down before production use):

```
POST /api/v1/api-keys
{ "name": "My App" }
```

Use the returned `key` value as `x-api-key` on subsequent requests.

## API Overview

### Forms (`/api/v1/forms`)
- `POST /` — create a form (with optional fields)
- `GET /` — list forms
- `GET /:id` — get a form
- `PUT /:id` — update a form (replaces fields if provided)
- `DELETE /:id` — delete a form

### Form Submissions (`/api/v1/forms/:formId/submissions`)
- `POST /` — submit form data
- `GET /` — list submissions
- `GET /:id` — get a submission
- `DELETE /:id` — delete a submission

### Analytics Events (`/api/v1/forms/:formId/events`)
- `POST /` — record an event (`VIEW`, `START`, `FIELD_FOCUS`, `FIELD_CHANGE`, `SUBMIT`, `ABANDON`, `ERROR`)
- `GET /` — list events
- `GET /summary` — aggregated counts by type + conversion rate (submit / view)

### API Keys (`/api/v1/api-keys`)
- `POST /` — create a key
- `GET /` — list keys
- `PATCH /:id/revoke` — deactivate a key
