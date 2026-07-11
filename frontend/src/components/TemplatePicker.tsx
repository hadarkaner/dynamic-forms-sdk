import { FORM_TEMPLATES, FormTemplate } from "../data/formTemplates";

interface TemplatePickerProps {
  selectedId: string | null;
  onSelect: (template: FormTemplate | null) => void;
}

export const TemplatePicker = ({ selectedId, onSelect }: TemplatePickerProps) => (
  <div className="template-picker">
    <button
      type="button"
      className={`template-card${selectedId === null ? " template-card-selected" : ""}`}
      onClick={() => onSelect(null)}
    >
      <strong>טופס ריק</strong>
      <span>התחל מאפס, בלי שדות מוכנים.</span>
    </button>
    {FORM_TEMPLATES.map((template) => (
      <button
        type="button"
        key={template.id}
        className={`template-card${selectedId === template.id ? " template-card-selected" : ""}`}
        onClick={() => onSelect(template)}
      >
        <strong>{template.name}</strong>
        <span>{template.description}</span>
      </button>
    ))}
  </div>
);
