const STYLE_TAG_ID = "dfsdk-default-styles";

// Default look & feel (Google Forms / Typeform inspired): a centered card, generous
// spacing, clear typography, styled radio/checkbox rows, and a modern submit button.
// Every color/spacing rule falls back to a sensible default via CSS custom properties,
// which DynamicForm sets per-instance from the form's theme (see applyTheme in render.ts).
// Consumers can still override any of this with their own CSS — nothing here uses !important.
const DEFAULT_CSS = `
.dfsdk-form {
  font-family: var(--dfsdk-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  background: var(--dfsdk-bg, #ffffff);
  color: var(--dfsdk-text, #202124);
  max-width: 640px;
  margin: 24px auto;
  padding: 36px 40px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.dfsdk-form * {
  box-sizing: border-box;
}

.dfsdk-form h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px;
  line-height: 1.3;
}

.dfsdk-form > p {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  margin: 0 0 28px;
  line-height: 1.5;
}

.dfsdk-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 22px;
}

.dfsdk-field label {
  font-size: 14px;
  font-weight: 500;
}

.dfsdk-field input[type="text"],
.dfsdk-field input[type="email"],
.dfsdk-field input[type="tel"],
.dfsdk-field input[type="number"],
.dfsdk-field textarea,
.dfsdk-field select {
  font: inherit;
  color: inherit;
  font-size: 15px;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.dfsdk-field input:focus,
.dfsdk-field textarea:focus,
.dfsdk-field select:focus {
  outline: none;
  border-color: var(--dfsdk-primary, #4f46e5);
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06);
}

.dfsdk-field textarea {
  min-height: 96px;
  resize: vertical;
}

.dfsdk-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dfsdk-options label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 400;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.dfsdk-options label:hover {
  background: rgba(0, 0, 0, 0.03);
  border-color: var(--dfsdk-primary, #4f46e5);
}

.dfsdk-options input[type="radio"],
.dfsdk-options input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--dfsdk-primary, #4f46e5);
  cursor: pointer;
}

.dfsdk-rating {
  display: flex;
  flex-direction: row-reverse;
  gap: 4px;
  width: fit-content;
}

.dfsdk-rating input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.dfsdk-rating label {
  font-size: 28px;
  line-height: 1;
  color: rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: color 0.1s ease;
}

.dfsdk-rating input:checked ~ label,
.dfsdk-rating label:hover,
.dfsdk-rating label:hover ~ label {
  color: var(--dfsdk-primary, #4f46e5);
}

.dfsdk-notice {
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 16px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(217, 119, 6, 0.1);
  color: #92400e;
  border: 1px solid rgba(217, 119, 6, 0.25);
}

.dfsdk-form button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dfsdk-form button[type="submit"] {
  display: inline-block;
  margin-top: 8px;
  padding: 12px 28px;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: var(--dfsdk-primary, #4f46e5);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.05s ease;
}

.dfsdk-form button[type="submit"]:hover {
  opacity: 0.9;
}

.dfsdk-form button[type="submit"]:active {
  transform: scale(0.98);
}

.dfsdk-success {
  text-align: center;
  padding: 16px 8px;
}

.dfsdk-success-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--dfsdk-primary, #4f46e5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  margin: 0 auto 18px;
}

.dfsdk-success-title {
  font-size: 19px;
  font-weight: 600;
  margin: 0 0 6px;
}

.dfsdk-success-message {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
  line-height: 1.5;
}
`;

// Injected once per page, no matter how many DynamicForm instances mount —
// avoids piling up duplicate <style> tags when a page embeds multiple forms.
export const injectDefaultStyles = (): void => {
  if (typeof document === "undefined" || document.getElementById(STYLE_TAG_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_TAG_ID;
  style.textContent = DEFAULT_CSS;
  document.head.appendChild(style);
};
