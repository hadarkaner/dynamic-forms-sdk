const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";

const API_KEY_STORAGE_KEY = "dfsdk_portal_api_key";
const BASE_URL_STORAGE_KEY = "dfsdk_portal_base_url";

export const getApiKey = (): string => localStorage.getItem(API_KEY_STORAGE_KEY) ?? "";

export const setApiKey = (key: string): void => {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
};

export const clearApiKey = (): void => {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
};

export const getBaseUrl = (): string => localStorage.getItem(BASE_URL_STORAGE_KEY) ?? DEFAULT_BASE_URL;

export const setBaseUrl = (url: string): void => {
  localStorage.setItem(BASE_URL_STORAGE_KEY, url);
};

export const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getApiKey(),
      ...init?.headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(body?.message ?? `Request failed with status ${res.status}`);
  }

  return body.data as T;
};
