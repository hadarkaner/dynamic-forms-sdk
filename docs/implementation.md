# Architecture & Implementation

This document explains the architectural decisions behind each component of the project, and how they connect.

## Core principle: Public vs Admin routes

The most important split in the project is between two kinds of API access:

| | Private routes (Admin) | Public routes |
|---|---|---|
| Base path | `/api/v1/forms`, `/api/v1/form-slots`, `/api/v1/api-keys` | `/api/v1/public/forms/:formId/...`, `/api/v1/public/form-slots/:key` |
| Auth | `x-api-key` header (secret key, checked against the `ApiKey` table) | None at all |
| Who calls it | Developer Portal, `sdk/server` | `sdk/client` (runs in the end user's browser, including inside a WebView in mobile apps) |
| What's exposed | All of the key owner's forms/slots, including drafts, listing, deletion, analytics summaries | A single form by `formId` (or slot), only if `isPublished === true` |

The reasoning: `sdk/client` has to run in an anonymous visitor's browser on a third-party site. If it sent the secret API key, anyone opening DevTools could steal it and get full access to the account owner's forms, submissions, and API keys. The solution, like Stripe (`pk_` vs `sk_`) or Typeform: **the form identifier (`formId`) is public by design** — knowing it lets you view the form and submit a response, but not list, edit, delete, or see other forms. This isn't a security hole, because it's exactly the property an embedded form needs — anyone visiting the page containing the form *already* sees the `formId` in the page source.

Implementation: `backend/src/routes/public.routes.ts` — every endpoint filters in the service layer (`FormService.findPublishedById`, `SubmissionService.createPublic`, `AnalyticsEventService.createPublic`, `FormSlotService.resolvePublic`) by `isPublished: true` — not by `apiKeyId`. The `apiKeyId` field (the internal owner id) is intentionally omitted from public responses so no unnecessary internal information leaks to the client.

## Backend API

Express + TypeScript, organized around Clean Architecture:

```
routes → controllers → services → Prisma (models)
```

- **routes** — define the endpoint + middleware (auth, validation).
- **controllers** — translate the HTTP request/response, no business logic.
- **services** — business logic and all DB access via Prisma. The only layer that knows about `prisma.*`.
- **models** — [Zod](https://zod.dev) schemas for input validation (not Prisma models — those live in `prisma/schema.prisma`).
- **middlewares** — `apiKeyAuth` (checks `x-api-key` against the `ApiKey` table), `validateBody` (runs a Zod schema), `errorHandler` (maps `AppError`/`ZodError` to a consistent JSON response).

The resources: **Form** (with nested **FormField**s), **FormSlot**, **FormSubmission**, **AnalyticsEvent**, **ApiKey** — each with its own service/controller/routes under `backend/src/`.

## Developer Portal (frontend)

A React+TypeScript (Vite) app that uses **only** the private routes. Organized as:

- `types/` — TypeScript types matching the backend's models.
- `services/` — a central `apiClient.ts` that attaches `x-api-key` (kept in `localStorage`) to every call; a dedicated service per resource.
- `hooks/` — `useConnection` (a global context for the key/base URL), plus data-fetching hooks (`useForms`, `useForm`, `useFormSlots`, `useSubmissions`, `useAnalyticsSummary`, `useApiKeys`) with loading/error/refetch.
- `components/` — `Layout` (nav sidebar), `ConnectionGate` (a landing screen that requests/issues a key), `FormFieldEditor` (a dynamic field builder), shared UI pieces.
- `pages/` — Forms list, Create, Edit (including a publish toggle), Form Slots, Submissions, Analytics (summary + event table), API Keys.

**The bootstrap problem:** managing forms requires an API key, but issuing a first key requires no auth (`POST /api-keys` is intentionally open). `ConnectionGate` takes advantage of that: it lets you create a first key directly from the UI, without requiring something that doesn't exist yet.

## Client SDK (`sdk/client`)

A TypeScript package built (`tsup`) into three formats — ESM, CommonJS, and a global IIFE (`DynamicFormsSDK.DynamicForm`) — so it works via `npm install`, via a plain `<script>` tag on a site with no bundler at all, and embedded inside a `WebView` in a native mobile app (see [Code Examples](/examples)).

The `DynamicForm` class takes `baseUrl`, `formId` **or** `slot`, and a `container` (a DOM element or selector), and:
1. If given a `slot` — resolves it to a `formId` via `/public/form-slots/:key` (fresh on every `mount()`).
2. Fetches the form schema from `/public/forms/:formId`.
3. Renders an appropriate input for each field type (`TEXT`, `TEXTAREA`, `NUMBER`, `EMAIL`, `PHONE`, `DATE`, `RATING`, `CHECKBOX`, `RADIO`, `SELECT`).
4. Automatically reports analytics events: `VIEW` on mount, `START` on first field focus, `FIELD_FOCUS`/`FIELD_CHANGE` per field, `SUBMIT` on success (tagged `wasOffline` if sent via the retry queue), `ABANDON` if the page closes before submitting, `ERROR` if submission fails.
5. Posts submissions to `/public/forms/:formId/submissions` — and if the network is unavailable, saves them locally and retries automatically (see [How to Use](/how-to-use#handling-offline)).

Analytics reporting is always "silent" — a failed event report never blocks or breaks the form-filling experience.

### Core value: content updates with no redeploy for the integrator

This is the feature that drives the whole SDK design: **the integrator embeds `DynamicForm` once**, with a fixed `formId`/`slot` — and from then on, any content change (or even swapping the form entirely, in the slot case) happens **only in the portal**, without touching third-party code.

Three principles working together make this possible:

1. **`formId` identifies a form (a stable container), not a version.** The `formId` written into the embed code never changes, even as the form's owner creates and publishes new versions.
2. **`DynamicForm.mount()` fetches a fresh schema on every call**, with no client-side caching. Every page load at the visitor's site re-runs `GET /public/forms/:formId`, and the backend returns whichever version is flagged `isPublished: true` **at that exact moment**.
3. **`slot` takes principle 1 a step further** — not just "same form, new version," but "an entirely different form, same embedded code."

In practice: the form's owner edits a field, adds a question, or tweaks wording in the portal and clicks **Publish** — and the external site/app "receives" the updated content **immediately** on the next load, with no new build, no deploy. A full test scenario is documented in [Testing the Full Flow](/testing).

## Server SDK (`sdk/server`)

A Node.js package (TypeScript, `tsup`, ESM+CJS) with a `DynamicFormsClient` class that wraps **all** the private routes via `fetch` + an `x-api-key` header. Meant to run only in server-side code — if an integrator embeds it in client-side code, their secret key gets sent to the browser. The package's README warns about this explicitly.

## Version History for forms

This is the Developer Portal's core feature: every form has a full version history, and there's no "edit in place" — every content change creates a new, immutable version.

- **Form** is a stable container only — `id`, `apiKeyId` (the owner), timestamps. It has no title, description, or fields of its own.
- **FormVersion** is the sole unit of content — `versionNumber` (1, 2, 3...), `title`, `description?`, a list of `FormField`, and an `isPublished` flag.
- **The "current" version** = the version with the highest `versionNumber` for the form.
- **The "published" version** = the one version (at most) with `isPublished: true` — the one the public SDK serves.

The API workflow:

```
POST   /forms                              → creates a form + version 1 (draft)
POST   /forms/:id/versions                 → "save" = creates the next version (draft, doesn't touch what's published)
GET    /forms/:id/versions                 → full history, newest to oldest
GET    /forms/:id/versions/:versionId      → view a single version
POST   /forms/:id/versions/:versionId/restore → copies an old version's content into a new version (doesn't auto-publish)
PATCH  /forms/:id/publish  { versionId? }  → publishes a version (default: the current one)
PATCH  /forms/:id/unpublish                → takes the form offline without deleting history
```

An important architectural point: the public route (`GET /public/forms/:formId`) **is never exposed to the version model at all** — it keeps returning a flat response shape (`id`, `title`, `description`, `isPublished`, `fields`), so `sdk/client` needed no change when the feature was added.

## Form Slots — a stable pointer you can redirect to any form

Where versioning answers "same form, new content," a **slot** answers a different question: "same embedded code, an *entirely different* form." A `FormSlot` is a record with a stable `key` (e.g. `"main-survey"`) and an optional `formId` pointing at whichever form is currently assigned to it.

Design notes:

- **`key` is globally unique**, not just per `apiKeyId`. The public route `GET /public/form-slots/:key` doesn't take an `x-api-key` at all (just like `GET /public/forms/:formId`), so there's no account context to filter by — the solution is the same tradeoff `Form.id` already makes as a public identifier.
- **Resolution is deliberately two-step**: `GET /public/form-slots/:key` returns only `{ slot, formId, versionId }` — not the form schema itself. The SDK then calls the existing `GET /public/forms/:formId`. This leaves the existing route untouched, and allows separate caching/logic for each step.
- **Clear errors**: a slot that doesn't exist, isn't assigned to a form, or is assigned to a form with no published version — each returns a 404 with a different message, surfaced all the way to the SDK's `onError`.

## Data model (PostgreSQL + Prisma)

```
ApiKey 1───* Form 1───* FormVersion 1───* FormField
  │                │
  │                ├───* FormSubmission
  │                └───* AnalyticsEvent
  └───* FormSlot ──────* (formId?, points at a Form)
```

- **ApiKey** — `id`, `key` (unique, `dfsdk_<hex>` format), `name`, `isActive`. Deleting an `ApiKey` cascades to delete all its forms and slots.
- **Form** — a stable container: `apiKeyId` (the owner), timestamps. No content fields.
- **FormVersion** — `versionNumber`, `title`, `description?`, `isPublished`, `publishedAt?`. Unique on `(formId, versionNumber)`. Versions are immutable.
- **FormField** — belongs to a `FormVersion` (not a `Form`!) via `formVersionId`: `label`, `type` (a `FieldType` enum), `isRequired`, `order`, `options?`, `placeholder?`.
- **FormSlot** — `key` (globally unique), `apiKeyId` (the owner), `formId?` (nullable — a slot can be unassigned). Deleting a `Form` unlinks any slots pointing at it (`onDelete: SetNull`) instead of deleting them.
- **FormSubmission** — `data` (free-form JSON), `submittedAt`, `ipAddress?`, `userAgent?`. Belongs to a `Form`, not a specific version.
- **AnalyticsEvent** — `type` (an `EventType` enum), `metadata?` (free-form JSON). Also belongs to a `Form`, not a version — so analytics accumulate across the form's whole history.

Every table has `onDelete: Cascade` down from `Form` — deleting a form cleans up all its versions, fields, submissions, and events.

## Why Neon for PostgreSQL hosting

The project uses [Neon](https://neon.tech) — a managed, serverless PostgreSQL service:

1. **No local install** — no dependency on Docker or a locally installed PostgreSQL, which streamlines setup and testing across multiple machines.
2. **Free tier is plenty** — no cost for a project at this scale.
3. **Fully Prisma-compatible** — it's plain PostgreSQL (not a proprietary substitute), so `prisma migrate`/`generate` work with no code changes.
4. **Secure by default** — the connection string ships with `sslmode=require` built in.

Known limitation: Neon provides connection pooling via PgBouncer (`-pooler` in the hostname). Some heavier operations (complex migrations) are better run against a direct, non-pooled connection, but in this project the initial `migrate dev` ran successfully against the pooled connection too.
