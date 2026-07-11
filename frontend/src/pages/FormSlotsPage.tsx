import { FormEvent, useState } from "react";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { StatusBadge } from "../components/StatusBadge";
import { useForms } from "../hooks/useForms";
import { useFormSlots } from "../hooks/useFormSlots";
import { formSlotService } from "../services/formSlotService";

const UNASSIGNED = "";

export const FormSlotsPage = () => {
  const { slots, loading, error, refetch } = useFormSlots();
  const { forms } = useForms();
  const [key, setKey] = useState("");
  const [formId, setFormId] = useState(UNASSIGNED);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!key.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      await formSlotService.create(key.trim(), formId || null);
      setKey("");
      setFormId(UNASSIGNED);
      void refetch();
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleReassign = async (slotId: string, nextFormId: string) => {
    await formSlotService.assign(slotId, nextFormId || null);
    void refetch();
  };

  const handleDelete = async (slotId: string) => {
    if (!window.confirm("Delete this slot? Apps embedding it will stop resolving to any form.")) return;
    await formSlotService.remove(slotId);
    void refetch();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Form Slots</h1>
      </div>

      <p className="state-message">
        A slot is a stable key an app embeds once (e.g. <code>DynamicForm.open({"{"} slot: "main-survey" {"}"})</code>
        ) — swap which form it points to here, any time, without an app release.
      </p>

      <form className="card" onSubmit={handleCreate}>
        <label>
          Key
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="e.g. main-survey"
            pattern="[a-z0-9-]+"
            title="Lowercase letters, numbers, and hyphens only"
          />
        </label>
        <label>
          Assign to form (optional)
          <select value={formId} onChange={(e) => setFormId(e.target.value)}>
            <option value={UNASSIGNED}>Unassigned</option>
            {forms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.currentVersion.title} {form.isPublished ? "" : "(draft)"}
              </option>
            ))}
          </select>
        </label>
        {createError && <p className="form-error">{createError}</p>}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? "Creating..." : "Create slot"}
          </button>
        </div>
      </form>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && slots.length === 0 && (
        <p className="state-message">No slots yet — create one above.</p>
      )}

      {!loading && !error && slots.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Assigned form</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.id}>
                <td>
                  <code>{slot.key}</code>
                </td>
                <td>
                  <select
                    value={slot.formId ?? UNASSIGNED}
                    onChange={(e) => void handleReassign(slot.id, e.target.value)}
                  >
                    <option value={UNASSIGNED}>Unassigned</option>
                    {forms.map((form) => (
                      <option key={form.id} value={form.id}>
                        {form.currentVersion.title} {form.isPublished ? "" : "(draft)"}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  {slot.formId && !slot.formTitle && (
                    <span className="status-badge status-draft">Nothing published</span>
                  )}
                  {slot.formTitle && <StatusBadge isPublished />}
                </td>
                <td className="table-actions">
                  <button className="btn btn-danger" onClick={() => handleDelete(slot.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
