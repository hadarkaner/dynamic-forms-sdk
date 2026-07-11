# @dynamic-forms-sdk/client

Browser SDK for embedding a published Dynamic Forms SDK form on any page. Talks only to the backend's `/public/*` endpoints — no API key required, since it runs in the end user's browser.

## Usage (npm / bundler)

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

### Slots — swap which form is embedded without a code change

Instead of hardcoding a `formId`, embed a stable **slot** key and assign it to a published form from the Developer Portal. The SDK resolves the slot to a form on every `mount()`, so the admin can point it at a different form entirely — not just publish a new version of the same one — with no change on the embedding side:

```ts
DynamicForm.open({
  baseUrl: "https://api.example.com/api/v1",
  slot: "main-survey",
  container: "#form-container",
});
```

`DynamicForm.open(options)` is shorthand for `new DynamicForm(options).mount()` that also returns the instance (e.g. to call `.unmount()` later). Provide exactly one of `formId` or `slot` — mixing both, or providing neither, throws.

## Usage (plain `<script>` tag)

```html
<div id="form-container"></div>
<script src="https://unpkg.com/@dynamic-forms-sdk/client/dist/index.global.js"></script>
<script>
  const form = new DynamicFormsSDK.DynamicForm({
    baseUrl: "https://api.example.com/api/v1",
    formId: "<published-form-id>",
    container: "#form-container",
  });
  form.mount();
</script>
```

## What it does

- Fetches the published form schema and renders inputs for each field type (`TEXT`, `TEXTAREA`, `NUMBER`, `EMAIL`, `PHONE`, `DATE`, `RATING`, `CHECKBOX`, `RADIO`, `SELECT`). `RATING` renders a 5-star widget (CSS-only, no JS beyond standard radio handling) and submits a number (1–5).
- Injects a default stylesheet on first mount (a Google Forms/Typeform-style card: spacing, typography, styled radio/checkbox rows, a modern submit button) — no CSS required from the embedding page. Colors/font can be customized per form via the theme set in the Developer Portal (`primaryColor`, `backgroundColor`, `textColor`, `fontFamily`), applied as CSS custom properties (`--dfsdk-primary`, etc.) that the stylesheet falls back from.
- Shows a built-in success panel (checkmark + message) in place of the form after a successful submission. Customize the message with `successMessage` in the constructor options.
- Aligns each label, input, and option to its own text direction automatically (`dir="auto"`) — Hebrew/Arabic content aligns to the end (right), English/Latin content aligns to the start (left). No language detection needed, and a form can mix languages per field (e.g. a Hebrew label with an English-typed answer).
- Automatically reports analytics events: `VIEW` on mount, `START` on first field focus, `FIELD_FOCUS` / `FIELD_CHANGE` per field, `SUBMIT` on success, `ABANDON` if the page is closed before submitting (skipped while a submission is queued offline — see below), `ERROR` on a failed submission.
- Posts submissions to `/public/forms/:formId/submissions`.

### Offline handling

The form never loses what a user has typed, even without a connection:

- Every keystroke is autosaved as a draft to `localStorage` (keyed by `formId`), and restored automatically if the page is reloaded or reopened before the user submits.
- If Submit is pressed with no connection (or the request fails with a network error, as opposed to a server-side validation error), the answers are queued as a "pending submission", the form is locked (so it can't drift from what's queued), and a banner is shown — customize its text with `offlineMessage` in the constructor options.
- The queued submission is sent automatically as soon as connectivity returns (via the `online` event, plus a periodic retry as a fallback), including right after a page reload if it's still queued from a previous visit.
- Once the submission succeeds, the draft and the queued submission are both cleared and the normal success panel is shown.

Only forms with `isPublished: true` are reachable through these endpoints — the form id is a public identifier, not a secret. `correctOptions` (if set on a RADIO/CHECKBOX field) is authoring-only metadata and is never sent to this endpoint.

## Build

```
npm install
npm run build
```

Outputs ESM (`dist/index.esm.js`), CJS (`dist/index.cjs.js`), and a global IIFE bundle (`dist/index.global.js`) for plain `<script>` embedding.
