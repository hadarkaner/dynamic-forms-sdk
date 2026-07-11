# Mobile Demo App

An Expo (React Native) app that shows how `@dynamic-forms-sdk/client` integrates into **native mobile**: it simulates a real app that already integrated the SDK, and demonstrates the integration pattern documented for mobile — a **WebView inside a bottom sheet**.

The SDK itself is JavaScript that runs in a browser engine; it cannot run directly in native UI (Kotlin/Swift/React Native components). The standard pattern, used here, is to host the same HTML/JS the web demo uses inside a `WebView`, presented as a bottom sheet over the existing screen.

## How it's wired

- **`src/sdkBundle.ts`** — the built `@dynamic-forms-sdk/client` IIFE bundle (`sdk/client/dist/index.global.js`), embedded as a string constant. Metro (React Native's bundler) can't load a `node_modules` file as raw text at runtime the way a web bundler can, so the script is inlined into the HTML instead of referenced by URL. Regenerate it after rebuilding the SDK:
  ```bash
  cd sdk/client && npm run build
  cd ../../mobile-demo-app && npm run sync-sdk
  ```
  In a real (non-demo) app you'd more likely load the SDK from a CDN URL (e.g. `unpkg`) the same way the web demo's `<script>` tag does — inlining here only exists because this package isn't published and the demo needs to work standalone.
- **`src/surveyHtml.ts`** — builds the HTML page the `WebView` loads: inlines the bundle, then calls `new DynamicFormsSDK.DynamicForm({ baseUrl, formId, container }).mount()`, the same way any browser embed of the SDK would. `onSubmit`/`onError` call `window.ReactNativeWebView.postMessage(...)` so the native side can react (close the sheet, show a banner).
- **`App.tsx`** — a single screen with an **Open Survey** button. Tapping it presents a `Modal` pinned to the bottom (the bottom-sheet pattern) containing the `WebView`. Receiving a `"submitted"` message auto-closes the sheet after a short delay.
- **`src/config.ts`** — the one place `baseUrl`/`formId` are configured. The end user never sees or enters either value.

## Running it

1. Make sure the backend is running and you have a **published** form (create one via the Developer Portal — see the root README).
2. Build the client SDK if you haven't already, and sync the bundle:
   ```bash
   cd sdk/client && npm install && npm run build
   cd ../../mobile-demo-app && npm install && npm run sync-sdk
   ```
3. Edit `src/config.ts`:
   - `DEMO_FORM_ID` — the published form's id.
   - `API_BASE_URL` — **`localhost` means the phone/emulator itself, not your dev machine.** Use:
     - Android emulator: `http://10.0.2.2:4000/api/v1` (already the default)
     - Physical phone via Expo Go: your machine's LAN IP, e.g. `http://192.168.1.50:4000/api/v1` (find it with `ipconfig` / `ifconfig`) — phone and dev machine must be on the same Wi-Fi network.
4. Start the dev server:
   ```bash
   npm start
   ```
   Scan the QR code with **Expo Go** (Android/iOS), or press `a`/`i` for an emulator/simulator if you have Android Studio/Xcode installed.
5. Tap **Open Survey** — the bottom sheet should slide up with the form rendered exactly as it would in the web demo (same styling, since it's the same SDK and stylesheet). Submitting shows a success banner and auto-closes the sheet after ~1.2s.

**"Project is incompatible with this version of Expo Go":** the Expo Go app version on your phone must match the project's Expo SDK version. The project targets **SDK 54** because that's what was confirmed to match the installed Expo Go app during testing — Expo Go on app stores generally lags a release or two behind the newest SDK. The Expo Go app's own version number (e.g. "54.0.2") corresponds to the SDK it supports. If you update Expo Go and it moves to a newer SDK, match the project to it with:
```bash
npx expo install expo@^<sdk-version>.0.0
npx expo install --fix
```

**Scanning the QR code does nothing, or the form never loads (blank/stuck) once inside — Windows Firewall.** On a **Private**-profile Wi-Fi network, Windows Firewall silently drops unsolicited inbound connections from other devices (like your phone) unless a rule explicitly allows the port — it doesn't reject the connection, it just drops it, so the request hangs instead of failing fast. This blocks both the backend (port 4000) and Metro/Expo's dev server (port 8081) the same way. Confirm your network's profile with `Get-NetConnectionProfile`, then, in an **elevated** ("Run as administrator") PowerShell:
```powershell
New-NetFirewallRule -DisplayName "Dynamic Forms Backend (dev)" -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow -Profile Private
New-NetFirewallRule -DisplayName "Expo Metro (dev)" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow -Profile Private
```
To sanity-check reachability independent of the app, open `http://<your-LAN-IP>:4000/health` in the **phone's own browser** — if that hangs too, it's this, not the app.

**Scanning with the phone's regular camera app does nothing.** The QR code encodes an `exp://` link, not `https://` — plain camera apps often don't know what to do with that scheme. Use Expo Go's own **"Scan QR code"** button inside the app, not the system camera.

## What this demonstrates

The same `formId`-based, "edit and publish in the portal, no app update needed" behavior documented in [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) and [docs/TESTING.md](../docs/TESTING.md) applies here unchanged: the WebView fetches the form fresh every time it mounts, so publishing a new version in the Developer Portal updates what mobile users see without an app store release.
