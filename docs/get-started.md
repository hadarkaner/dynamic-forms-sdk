# Get Started

## Prerequisites

- Node.js 18+ (ships with a global `fetch`, required by both SDKs)
- A PostgreSQL database — [Neon](https://neon.tech) recommended (cloud, free tier), but any standard PostgreSQL works

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # set DATABASE_URL
npm run prisma:migrate      # creates the tables
npm run dev                 # http://localhost:4000
```

Health check: `GET http://localhost:4000/health`

## 2. Developer Portal (frontend)

```bash
cd frontend
npm install
cp .env.example .env        # optional: VITE_API_BASE_URL
npm run dev                 # http://localhost:5173
```

On first load the portal shows a "Connect" screen — click **"No key yet? Create one"** to issue a first API key directly from the UI (possible because `POST /api-keys` is an intentionally open bootstrap endpoint).

## 3. sdk/client

```bash
cd sdk/client
npm install
npm run build                # outputs dist/index.{esm,cjs,global}.js + types
```

## 4. sdk/server

```bash
cd sdk/server
npm install
npm run build
```

## 5. Create and publish your first form

1. In the portal, **Forms** → **+ Create form**. Give it a title, add a field or two.
2. **Publish** — the status flips from `Draft` to `Published`.
3. The `formId` appears in the URL (`/forms/<formId>`) — it's public, ready to embed.

From here, continue to [How to Use](/how-to-use) for the actual embed, or [Code Examples](/examples) to see what it looks like in the browser and on mobile.

## Running this site locally

```bash
cd docs
npm install
npm run docs:dev
```
