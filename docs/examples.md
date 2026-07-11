# Code Examples

## Basic browser embed

```ts
import { DynamicForm } from "@dynamic-forms-sdk/client";

const form = new DynamicForm({
  baseUrl: "https://api.example.com/api/v1",
  formId: "<published-form-id>",
  container: "#form-container",
  onSubmit: (data) => console.log("submitted successfully", data),
  onError: (err) => console.error(err),
});

form.mount();
```

## Via a plain `<script>` tag (no npm)

```html
<div id="form-container"></div>
<script src="https://unpkg.com/@dynamic-forms-sdk/client/dist/index.global.js"></script>
<script>
  new DynamicFormsSDK.DynamicForm({
    baseUrl: "https://api.example.com/api/v1",
    formId: "<published-form-id>",
    container: "#form-container",
  }).mount();
</script>
```

## With a Slot instead of a fixed formId

```ts
DynamicForm.open({
  baseUrl: "https://api.example.com/api/v1",
  slot: "main-survey",
  container: "#form-container",
});
```

## Inside a native mobile app (WebView + bottom sheet)

The SDK is browser code — it can't run directly as React Native components. The pattern: a `WebView` loading inlined HTML, inside a `Modal` pinned to the bottom of the screen. The snippet below is the core of `surveyHtml.ts` in the Expo/React Native app:

```ts
export const buildSurveyHtml = (baseUrl: string, slot: string): string => `
<!doctype html>
<html>
  <body>
    <div id="form-container"></div>
    <script>${DFSDK_BUNDLE}</script>
    <script>
      var form = new DynamicFormsSDK.DynamicForm({
        baseUrl: ${JSON.stringify(baseUrl)},
        slot: ${JSON.stringify(slot)},
        container: "#form-container",
        onSubmit: function (data) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: "submitted", data: data })
          );
        },
        onError: function (error) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: "error", message: error.message })
          );
        },
      });
      form.mount();
    </script>
  </body>
</html>
`;
```

And the native side, in `App.tsx` — a bottom sheet listening for messages from the WebView:

```tsx
<Modal visible={popupVisible} animationType="fade" transparent>
  <WebView
    source={{ html: buildSurveyHtml(API_BASE_URL, FORM_SLOT) }}
    onMessage={handleWebViewMessage}
  />
</Modal>
```

```ts
const handleWebViewMessage = (event: WebViewMessageEvent) => {
  const payload = JSON.parse(event.nativeEvent.data);
  if (payload.type === "submitted") {
    setTimeout(() => {
      setPopupVisible(false);
      setPhase("thanks");
    }, 900);
  }
};
```

The bundle itself (`sdk/client/dist/index.global.js`) is embedded as a string in the code rather than loaded from a URL, because Metro (React Native's bundler) can't load a `node_modules` file as raw text at runtime. In a real (non-demo) app, loading from a CDN is preferable — exactly like the `<script>` example above.

## Managing forms from server code (sdk/server)

```ts
import { DynamicFormsClient } from "@dynamic-forms-sdk/server";

const client = new DynamicFormsClient({
  apiKey: process.env.DYNAMIC_FORMS_API_KEY!,
  baseUrl: "https://api.example.com/api/v1",
});

// Creating a form automatically creates its first version (v1), as a draft
const form = await client.createForm({
  title: "Contact Us",
  fields: [
    { label: "Name", type: "TEXT", isRequired: true, order: 0 },
    { label: "Email", type: "EMAIL", isRequired: true, order: 1 },
  ],
});

// Publish v1 — now available through the public routes / sdk/client
await client.publishVersion(form.id);

// Editing never changes an existing version — it creates a new one (v2) as a draft,
// while v1 stays the live version until v2 is explicitly published
await client.createVersion(form.id, {
  title: "Contact Us",
  fields: [
    { label: "Name", type: "TEXT", isRequired: true, order: 0 },
    { label: "Email", type: "EMAIL", isRequired: true, order: 1 },
    { label: "Phone", type: "TEXT", isRequired: false, order: 2 },
  ],
});

const history = await client.listVersions(form.id); // newest to oldest
await client.publishVersion(form.id);                // publishes the current (latest) version

const submissions = await client.listSubmissions(form.id);
const summary = await client.getAnalyticsSummary(form.id);
```

## Swapping an entire form via a slot, from server code

```ts
const slot = await client.createFormSlot({ key: "main-survey", formId: form.id });

// Later, without touching the embedded code at all — swap to a completely different form:
await client.assignFormSlot(slot.id, otherForm.id);
```
