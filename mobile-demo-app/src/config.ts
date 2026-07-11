// Configured once, at integration time. End users never see or enter these values.
//
// IMPORTANT: "localhost" means the phone/emulator itself, not your dev machine.
// - Android emulator: use http://10.0.2.2:4000/api/v1 to reach your machine's localhost.
// - Physical phone (Expo Go): use your machine's LAN IP, e.g. http://192.168.1.50:4000/api/v1
//   (find it with `ipconfig` on Windows / `ifconfig` on Mac/Linux). The phone and your
//   dev machine must be on the same Wi-Fi network.
export const API_BASE_URL = "http://192.168.1.132:4000/api/v1";

// Paste a published form's id here (see backend/README.md or the Developer Portal).
export const DEMO_FORM_ID = "db8245e4-bbc2-47b1-8ad4-e26ec4c263fd";

// When the survey popup should appear — the integrating developer's choice, not the
// end user's. Anchored to the order-success screen (the moment a real app would want
// feedback), not to app launch:
// - "delay": pops up automatically POPUP_DELAY_MS after the order succeeds.
// - "button": stays hidden until the user taps the trigger button on screen.
export const POPUP_TRIGGER: "delay" | "button" = "delay";

// Only used when POPUP_TRIGGER is "delay".
export const POPUP_DELAY_MS = 1_500;
