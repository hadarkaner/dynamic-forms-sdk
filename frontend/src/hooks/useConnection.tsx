import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { clearApiKey, getApiKey, getBaseUrl, setApiKey, setBaseUrl } from "../services/apiClient";

interface ConnectionContextValue {
  apiKey: string;
  baseUrl: string;
  isConnected: boolean;
  connect: (apiKey: string, baseUrl: string) => void;
  disconnect: () => void;
}

const ConnectionContext = createContext<ConnectionContextValue | undefined>(undefined);

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
  const [apiKey, setApiKeyState] = useState(getApiKey());
  const [baseUrl, setBaseUrlState] = useState(getBaseUrl());

  const value = useMemo<ConnectionContextValue>(
    () => ({
      apiKey,
      baseUrl,
      isConnected: apiKey.length > 0,
      connect: (nextApiKey: string, nextBaseUrl: string) => {
        setApiKey(nextApiKey);
        setBaseUrl(nextBaseUrl);
        setApiKeyState(nextApiKey);
        setBaseUrlState(nextBaseUrl);
      },
      disconnect: () => {
        clearApiKey();
        setApiKeyState("");
      },
    }),
    [apiKey, baseUrl]
  );

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
};

export const useConnection = (): ConnectionContextValue => {
  const ctx = useContext(ConnectionContext);
  if (!ctx) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return ctx;
};
