import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { FormFieldEditor } from "../components/FormFieldEditor";
import { LoadingState } from "../components/LoadingState";
import { StatusBadge } from "../components/StatusBadge";
import { ThemeEditor } from "../components/ThemeEditor";
import { useForm } from "../hooks/useForm";
import { formService } from "../services/formService";
import { FormFieldInput, FormTheme } from "../types/form";

export const EditFormPage = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { form, loading, error, refetch } = useForm(formId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormFieldInput[]>([]);
  const [theme, setTheme] = useState<FormTheme>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (form) {
      const current = form.currentVersion;
      setTitle(current.title);
      setDescription(current.description ?? "");
      setTheme(current.theme ?? {});
      setFields(
        current.fields.map((field) => ({
          label: field.label,
          type: field.type,
          isRequired: field.isRequired,
          order: field.order,
          options: field.options ?? undefined,
          correctOptions: field.correctOptions ?? undefined,
          placeholder: field.placeholder ?? undefined,
        }))
      );
    }
  }, [form]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!form || !formId) return <ErrorState message="Form not found" />;

  const isCurrentPublished = form.publishedVersion?.id === form.currentVersion.id;

  const handleSaveAsNewVersion = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      // Saving never edits a version in place — it always creates the next version (draft).
      await formService.createVersion(formId, {
        title: title.trim(),
        description: description.trim() || undefined,
        theme,
        fields,
      });
      await refetch();
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishCurrent = async () => {
    await formService.publish(formId, form.currentVersion.id);
    await refetch();
  };

  const handleUnpublish = async () => {
    await formService.unpublish(formId);
    await refetch();
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this form? This also deletes all its versions, submissions, and events.")) return;
    await formService.remove(formId);
    navigate("/");
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>
          {form.currentVersion.title} <StatusBadge isPublished={form.isPublished} />
          <span className="version-tag">
            editing v{form.currentVersion.versionNumber}
            {form.publishedVersion && ` — live: v${form.publishedVersion.versionNumber}`}
          </span>
        </h1>
        <div className="page-header-actions">
          <Link className="btn btn-ghost" to={`/forms/${formId}/versions`}>
            History
          </Link>
          <Link className="btn btn-ghost" to={`/forms/${formId}/submissions`}>
            Submissions
          </Link>
          <Link className="btn btn-ghost" to={`/forms/${formId}/analytics`}>
            Analytics
          </Link>
          {form.isPublished ? (
            <button className="btn btn-secondary" onClick={handleUnpublish}>
              Unpublish
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={handlePublishCurrent}>
              Publish v{form.currentVersion.versionNumber}
            </button>
          )}
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {form.isPublished && !isCurrentPublished && (
        <p className="state-message">
          The live form is v{form.publishedVersion?.versionNumber}. Saving below creates a new
          draft (v{form.currentVersion.versionNumber + 1}) without affecting it — publish it
          explicitly when ready.
        </p>
      )}

      <form className="card" onSubmit={handleSaveAsNewVersion}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <h2>Appearance</h2>
        <ThemeEditor theme={theme} onChange={setTheme} />

        <h2>Fields</h2>
        <FormFieldEditor fields={fields} onChange={setFields} />

        {saveError && <p className="form-error">{saveError}</p>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : `Save as v${form.currentVersion.versionNumber + 1}`}
          </button>
        </div>
      </form>
    </div>
  );
};
