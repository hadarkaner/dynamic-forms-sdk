# How to Use

## sdk/client — embedding in a browser or WebView

```ts
import { DynamicForm } from "@dynamic-forms-sdk/client";

const form = new DynamicForm({
  baseUrl: "https://api.example.com/api/v1",
  formId: "<published-form-id>",
  container: "#form-container",
  onSubmit: (data) => console.log("submitted", data),
  onError: (err) => console.error(err),
});

form.mount();
```

Or the shorthand — `DynamicForm.open(options)` is equivalent to `new DynamicForm(options).mount()`, and also returns the instance (e.g. to call `.unmount()` later):

```ts
const form = DynamicForm.open({ baseUrl, formId, container: "#form-container" });
```

### DynamicFormOptions

| Option | Type | Required | Meaning |
|---|---|---|---|
| `baseUrl` | `string` | Yes | API base URL, e.g. `https://api.example.com/api/v1` |
| `formId` | `string` | One of two | A fixed form id. Provide **exactly one** of `formId`/`slot` |
| `slot` | `string` | One of two | A stable slot key (e.g. `"main-survey"`) — see [Slots](#slots-a-form-you-can-swap-with-no-code-change) below |
| `container` | `string \| HTMLElement` | Yes | Selector or DOM element to render the form into |
| `onSubmit` | `(data) => void` | No | Called after a successful submission |
| `onError` | `(error: Error) => void` | No | Called when loading or submitting fails |
| `submitLabel` | `string` | No | Submit button text. Default: `"Submit"` |
| `successMessage` | `string` | No | Text on the built-in success screen |
| `offlineMessage` | `string` | No | Shown when a submission can't reach the server and is queued for automatic retry |

### Slots — a form you can swap with no code change

A fixed `formId` lets you edit **that** form and publish a new version. `slot` goes a step further — it lets you swap which **entirely different form** the slot points to, directly from the **Form Slots** page in the portal:

```ts
DynamicForm.open({
  baseUrl,
  slot: "main-survey",
  container: "#form-container",
});
```

The SDK calls `GET /public/form-slots/:key` on every `mount()`, gets back `{ slot, formId, versionId }`, and only then fetches the form schema — so reassigning the slot in the portal takes effect the next time the app loads, with no change to the embedded code.

If the slot doesn't exist, isn't assigned to a form, or the assigned form isn't published — `onError` is called with a clear message (e.g. `No form is assigned to slot "main-survey"`).

### Handling offline

The form never loses answers, even without a connection:

- Every keystroke autosaves as a draft (`localStorage`), restored if the page reloads before submitting.
- If a submission fails due to a network issue (not a server-side validation error), the answers are queued as a "pending submission," the form locks, and a message is shown (`offlineMessage`).
- As soon as the connection returns (the `online` event, plus a periodic fallback timer), the submission is sent automatically — even after a page reload.

## sdk/server — server-side management

```ts
import { DynamicFormsClient } from "@dynamic-forms-sdk/server";

const client = new DynamicFormsClient({
  apiKey: process.env.DYNAMIC_FORMS_API_KEY!,
  baseUrl: "https://api.example.com/api/v1",
});

const form = await client.createForm({
  title: "Contact Us",
  fields: [
    { label: "Name", type: "TEXT", isRequired: true, order: 0 },
    { label: "Email", type: "EMAIL", isRequired: true, order: 1 },
  ],
});

await client.publishVersion(form.id);
```

::: warning
The API key is a secret. `sdk/server` is meant to run **only** in server-side code — embedding it in client-side code sends the key to the browser, where anyone opening DevTools can steal it.
:::

Key methods: `createForm`, `listForms`, `deleteForm`, `createVersion`, `listVersions`, `publishVersion`, `unpublish`, `restoreVersion`, `listSubmissions`, `getAnalyticsSummary`, `createApiKey`. Full detail in [Code Examples](/examples).
