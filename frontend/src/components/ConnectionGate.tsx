import { FormEvent, ReactNode, useState } from "react";
import { getBaseUrl, setBaseUrl as persistBaseUrl } from "../services/apiClient";
import { apiKeyService } from "../services/apiKeyService";
import { useConnection } from "../hooks/useConnection";

export const ConnectionGate = ({ children }: { children: ReactNode }) => {
  const { isConnected, connect } = useConnection();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [baseUrlInput, setBaseUrlInput] = useState(getBaseUrl());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isConnected) {
    return <>{children}</>;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!apiKeyInput.trim()) return;
    connect(apiKeyInput.trim(), baseUrlInput.trim());
  };

  const handleCreateKey = async () => {
    setError(null);
    setCreating(true);
    try {
      // POST /api-keys requires no auth — it's how the very first key gets issued.
      persistBaseUrl(baseUrlInput.trim());
      const created = await apiKeyService.create("Developer Portal");
      setApiKeyInput(created.key);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="connection-gate">
      <form className="connection-card" onSubmit={handleSubmit}>
        <h1>Connect to your backend</h1>
        <p>
          Paste a secret API key (create one from the API Keys page once connected, or via{" "}
          <code>POST /api-keys</code>) to manage forms, submissions, and analytics.
        </p>
        <label>
          Backend base URL
          <input
            value={baseUrlInput}
            onChange={(e) => setBaseUrlInput(e.target.value)}
            placeholder="http://localhost:4000/api/v1"
          />
        </label>
        <label>
          API key
          <input
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="dfsdk_..."
            type="text"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="connection-actions">
          <button type="submit" className="btn btn-primary">
            Connect
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleCreateKey} disabled={creating}>
            {creating ? "Creating..." : "No key yet? Create one"}
          </button>
        </div>
      </form>
    </div>
  );
};
