export type DeviceType = "Web" | "Android" | "iOS" | "Unknown";

// Coarse classification from User-Agent — enough for a Web/Android/iOS breakdown,
// not a full UA parser (no browser/OS version detail).
export const classifyDevice = (userAgent?: string | null): DeviceType => {
  if (!userAgent) return "Unknown";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  if (/android/i.test(userAgent)) return "Android";
  return "Web";
};
