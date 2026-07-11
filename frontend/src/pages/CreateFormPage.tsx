import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormFieldEditor } from "../components/FormFieldEditor";
import { TemplatePicker } from "../components/TemplatePicker";
import { ThemeEditor } from "../components/ThemeEditor";
import { FormTemplate } from "../data/formTemplates";
import { formService } from "../services/formService";
import { FormFieldInput, FormTheme } from "../types/form";

export const CreateFormPage = () => {
  const navigate = useNavigate();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormFieldInput[]>([]);
  const [theme, setTheme] = useState<FormTheme>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectTemplate = (template: FormTemplate | null) => {
    setSelectedTemplateId(template?.id ?? null);
    setTitle(template?.title ?? "");
    setDescription(template?.formDescription ?? "");
    setFields(template ? template.fields.map((f) => ({ ...f })) : []);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const form = await formService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        theme,
        fields,
      });
      navigate(`/forms/${form.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Create form</h1>
      </div>

      <h2>Start from a template</h2>
      <TemplatePicker selectedId={selectedTemplateId} onSelect={handleSelectTemplate} />

      <form className="card" onSubmit={handleSubmit}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contact us" />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <h2>Appearance</h2>
        <ThemeEditor theme={theme} onChange={setTheme} />

        <h2>Fields</h2>
        <FormFieldEditor fields={fields} onChange={setFields} />

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Creating..." : "Create form"}
          </button>
        </div>
      </form>
    </div>
  );
};
