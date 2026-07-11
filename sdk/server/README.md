# @dynamic-forms-sdk/server

Node.js SDK for managing Dynamic Forms SDK forms, reading submissions, and reading analytics — using the **secret** API key. This package must only run on a server (Node backend, serverless function, CI job). Never bundle it into a browser app; the secret key would be exposed. For embedding a form in a web page, use [`@dynamic-forms-sdk/client`](../client) instead.

## Usage

```ts
import { DynamicFormsClient } from "@dynamic-forms-sdk/server";

const client = new DynamicFormsClient({
  apiKey: process.env.DYNAMIC_FORMS_API_KEY!,
  baseUrl: "https://api.example.com/api/v1",
});

// Creating a form creates its first version (v1), as a draft.
const form = await client.createForm({
  title: "Contact us",
  fields: [
    { label: "Name", type: "TEXT", isRequired: true, order: 0 },
    { label: "Email", type: "EMAIL", isRequired: true, order: 1 },
  ],
});

// Publish v1 so it becomes reachable through the public endpoints / sdk/client.
await client.publishVersion(form.id);

// Editing never mutates a version in place — it creates a new one (v2), as a draft,
// while v1 stays live until you explicitly publish the new version.
await client.createVersion(form.id, {
  title: "Contact us",
  fields: [
    { label: "Name", type: "TEXT", isRequired: true, order: 0 },
    { label: "Email", type: "EMAIL", isRequired: true, order: 1 },
    { label: "Phone", type: "TEXT", isRequired: false, order: 2 },
  ],
});

const history = await client.listVersions(form.id); // newest first
await client.publishVersion(form.id);                // publishes the latest (current) version
// await client.publishVersion(form.id, history[2].id); // or publish a specific older version
// await client.restoreVersion(form.id, history[2].id); // or copy an old version's content into a new draft
// await client.unpublish(form.id);                     // take the form offline without deleting history

const submissions = await client.listSubmissions(form.id);
const summary = await client.getAnalyticsSummary(form.id);
```

## API surface

- Forms: `createForm`, `listForms`, `getForm`, `deleteForm`
- Versioning: `createVersion`, `listVersions`, `getVersion`, `restoreVersion`, `publishVersion`, `unpublish`
- Submissions: `listSubmissions`, `getSubmission`, `deleteSubmission`
- Analytics: `listEvents`, `getAnalyticsSummary`
- API keys: `createApiKey`, `listApiKeys`, `revokeApiKey`

## Build

```
npm install
npm run build
```
