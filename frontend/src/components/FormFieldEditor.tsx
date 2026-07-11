import { CORRECT_ANSWER_FIELD_TYPES, FIELD_TYPES, FormFieldInput } from "../types/form";

const SIMPLE_OPTIONS_FIELD_TYPES = new Set(["SELECT"]);
const CORRECT_ANSWER_TYPES = new Set(CORRECT_ANSWER_FIELD_TYPES);

interface FormFieldEditorProps {
  fields: FormFieldInput[];
  onChange: (fields: FormFieldInput[]) => void;
}

export const FormFieldEditor = ({ fields, onChange }: FormFieldEditorProps) => {
  const updateField = (index: number, patch: Partial<FormFieldInput>) => {
    const next = fields.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index).map((field, i) => ({ ...field, order: i })));
  };

  const addField = () => {
    onChange([
      ...fields,
      { label: "", type: "TEXT", isRequired: false, order: fields.length },
    ]);
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    const next = fields.slice();
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next.map((field, i) => ({ ...field, order: i })));
  };

  const addOption = (index: number) => {
    const field = fields[index];
    updateField(index, { options: [...(field.options ?? []), ""] });
  };

  const updateOption = (index: number, optionIndex: number, value: string) => {
    const field = fields[index];
    const oldValue = (field.options ?? [])[optionIndex];
    const nextOptions = (field.options ?? []).slice();
    nextOptions[optionIndex] = value;
    const nextCorrect = (field.correctOptions ?? []).map((c) => (c === oldValue ? value : c));
    updateField(index, { options: nextOptions, correctOptions: nextCorrect });
  };

  const removeOption = (index: number, optionIndex: number) => {
    const field = fields[index];
    const removed = (field.options ?? [])[optionIndex];
    const nextOptions = (field.options ?? []).filter((_, i) => i !== optionIndex);
    const nextCorrect = (field.correctOptions ?? []).filter((c) => c !== removed);
    updateField(index, { options: nextOptions, correctOptions: nextCorrect });
  };

  const toggleCorrectOption = (index: number, option: string, isCorrect: boolean) => {
    const field = fields[index];
    const current = field.correctOptions ?? [];
    const nextCorrect = isCorrect ? [...current, option] : current.filter((c) => c !== option);
    updateField(index, { correctOptions: nextCorrect });
  };

  return (
    <div className="field-editor">
      {fields.map((field, index) => (
        <div className="field-editor-row" key={index}>
          <input
            className="field-editor-label"
            placeholder="Field label"
            value={field.label}
            onChange={(e) => updateField(index, { label: e.target.value })}
          />
          <select
            value={field.type}
            onChange={(e) => updateField(index, { type: e.target.value as FormFieldInput["type"] })}
          >
            {FIELD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {SIMPLE_OPTIONS_FIELD_TYPES.has(field.type) && (
            <input
              className="field-editor-options"
              placeholder="Options (comma separated)"
              value={(field.options ?? []).join(", ")}
              onChange={(e) =>
                updateField(index, {
                  options: e.target.value
                    .split(",")
                    .map((opt) => opt.trim())
                    .filter(Boolean),
                })
              }
            />
          )}

          {CORRECT_ANSWER_TYPES.has(field.type) && (
            <div className="option-list">
              {(field.options ?? []).map((option, optionIndex) => (
                <div className="option-row" key={optionIndex}>
                  <input
                    value={option}
                    placeholder={`Option ${optionIndex + 1}`}
                    onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                  />
                  <label className="option-correct-toggle">
                    <input
                      type="checkbox"
                      checked={(field.correctOptions ?? []).includes(option)}
                      onChange={(e) => toggleCorrectOption(index, option, e.target.checked)}
                    />
                    Correct
                  </label>
                  <button type="button" className="btn btn-ghost" onClick={() => removeOption(index, optionIndex)}>
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-secondary" onClick={() => addOption(index)}>
                + Add option
              </button>
            </div>
          )}

          <label className="field-editor-required">
            <input
              type="checkbox"
              checked={field.isRequired}
              onChange={(e) => updateField(index, { isRequired: e.target.checked })}
            />
            Required
          </label>
          <div className="field-editor-actions">
            <button type="button" className="btn btn-ghost" onClick={() => moveField(index, -1)} disabled={index === 0}>
              ↑
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => moveField(index, 1)}
              disabled={index === fields.length - 1}
            >
              ↓
            </button>
            <button type="button" className="btn btn-danger" onClick={() => removeField(index)}>
              Remove
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-secondary" onClick={addField}>
        + Add field
      </button>
    </div>
  );
};
