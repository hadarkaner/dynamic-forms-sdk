import { FormTheme } from "../types/form";

const FONT_OPTIONS = [
  { label: "Default", value: "" },
  { label: "Sans-serif", value: "Arial, Helvetica, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Monospace", value: "'Courier New', monospace" },
];

interface ThemeEditorProps {
  theme: FormTheme;
  onChange: (theme: FormTheme) => void;
}

export const ThemeEditor = ({ theme, onChange }: ThemeEditorProps) => {
  const update = (patch: Partial<FormTheme>) => onChange({ ...theme, ...patch });

  return (
    <div className="theme-editor">
      <label>
        Primary color (buttons / accents)
        <input
          type="color"
          value={theme.primaryColor ?? "#4f7cff"}
          onChange={(e) => update({ primaryColor: e.target.value })}
        />
      </label>
      <label>
        Background color
        <input
          type="color"
          value={theme.backgroundColor ?? "#ffffff"}
          onChange={(e) => update({ backgroundColor: e.target.value })}
        />
      </label>
      <label>
        Text color
        <input
          type="color"
          value={theme.textColor ?? "#1a1d23"}
          onChange={(e) => update({ textColor: e.target.value })}
        />
      </label>
      <label>
        Font
        <select value={theme.fontFamily ?? ""} onChange={(e) => update({ fontFamily: e.target.value || undefined })}>
          {FONT_OPTIONS.map((font) => (
            <option key={font.label} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};
