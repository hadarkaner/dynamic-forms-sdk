---
layout: home

hero:
  name: Dynamic Forms SDK
  text: Forms that update without a redeploy
  tagline: Embed once — edit, publish, or even swap the form entirely, straight from the portal. On the web, and inside mobile apps.
  actions:
    - theme: brand
      text: Get Started
      link: /get-started
    - theme: alt
      text: How it works
      link: /implementation
    - theme: alt
      text: Code examples
      link: /examples

features:
  - icon: 🔌
    title: One-time embed
    details: "new DynamicForm({ baseUrl, formId, container }).mount() — or a stable Slot pointing at a form you can swap from the portal."
  - icon: 🚀
    title: Publish without a deploy
    details: Every mount() fetches the currently published version from the server. Edit in the portal = instant update for every visitor, no new build.
  - icon: 📱
    title: Works in native mobile too
    details: The exact same SDK runs inside a WebView inside a bottom sheet — Expo/React Native, or any Kotlin/Swift app with a WebView.
  - icon: 📡
    title: Doesn't fall over offline
    details: A draft autosaves as you type, and a submission that can't reach the server is sent automatically once the connection is back — no lost answers.
  - icon: 🔑
    title: A real public/admin split
    details: The form id is public, like Stripe's pk_ — the secret API key never reaches the end user's browser.
  - icon: 🎯
    title: Slots — not just a version, a different form
    details: An app embeds a stable slot like "main-survey" — swap which form it points to, not just publish a new version of the same one.
---

## Who this is for

- **Web/app developers** who want to collect feedback, surveys, or contact forms without maintaining form UI themselves, and without a release for every question change.
- **Mobile developers** (Expo/React Native, or any native app with a WebView) who want the same flexibility — a form driven by the server, not frozen inside the app binary.
- **Product teams** who want to edit form content themselves — text, questions, styling, and even which form shows in which slot — without filing a ticket with engineering.
- **Post-event flows**: after an order, after support, after checkout — the moment feedback actually has value.

The platform is made of four components: `backend` (Express API), `frontend` (Developer Portal for management), `sdk/client` (embedded on the visitor's side, in a browser or a WebView), and `sdk/server` (server-side management with a secret key). Full details in [Architecture](/implementation).
