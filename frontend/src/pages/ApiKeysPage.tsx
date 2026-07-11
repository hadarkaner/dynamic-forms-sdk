import { FormEvent, useState } from "react";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { useApiKeys } from "../hooks/useApiKeys";
import { useConnection } from "../hooks/useConnection";
import { apiKeyService } from "../services/apiKeyService";

export const ApiKeysPage = () => {
  const { apiKeys, loading, error, refetch } = useApiKeys();
  const { apiKey: activeApiKey, connect, baseUrl } = useConnection();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const created = await apiKeyService.create(name.trim());
      setNewKey(created.key);
      setName("");
      void refetch();
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (apiKeyId: string) => {
    if (!window.confirm("Revoke this API key? Anything using it will stop working.")) return;
    await apiKeyService.revoke(apiKeyId);
    void refetch();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>API Keys</h1>
      </div>

      <form className="card" onSubmit={handleCreate}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Marketing site" />
        </label>
        {createError && <p className="form-error">{createError}</p>}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? "Creating..." : "Create API key"}
          </button>
        </div>
      </form>

      {newKey && (
        <div className="card key-reveal">
          <strong>New key created — copy it now, it won't be shown again in full:</strong>
          <code>{newKey}</code>
        </div>
      )}

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.map((key) => (
              <tr key={key.id}>
                <td>{key.name}</td>
                <td>
                  <code>{key.key}</code>
                  {key.key === activeApiKey && <span className="status-badge status-published">In use</span>}
                </td>
                <td>
                  <span className={`status-badge ${key.isActive ? "status-published" : "status-draft"}`}>
                    {key.isActive ? "Active" : "Revoked"}
                  </span>
                </td>
                <td>{new Date(key.createdAt).toLocaleDateString()}</td>
                <td className="table-actions">
                  {key.isActive && key.key !== activeApiKey && (
                    <button className="btn btn-ghost" onClick={() => connect(key.key, baseUrl)}>
                      Use this key
                    </button>
                  )}
                  {key.isActive && (
                    <button className="btn btn-danger" onClick={() => handleRevoke(key.id)}>
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
