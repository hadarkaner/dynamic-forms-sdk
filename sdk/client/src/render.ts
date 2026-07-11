import { fetchForm, submitForm, trackEvent } from "./api";
import { injectDefaultStyles } from "./styles";
import { DynamicFormOptions, FormField, FormSchema } from "./types";

const RATING_STAR_COUNT = 5;
const RETRY_INTERVAL_MS = 15000;
const DEFAULT_OFFLINE_MESSAGE =
  "No internet connection. Your answers are saved and will be sent automatically once you're back online.";

interface PendingSubmission {
  data: Record<string, unknown>;
  savedAt: number;
}

// Network failures (offline, DNS down, connection reset) reject fetch() itself with a
// TypeError, before api.ts ever sees a response to inspect — HTTP-level failures (4xx/5xx,
// validation errors) instead resolve normally and are surfaced as a plain Error with the
// server's message. That distinction is what lets us queue-and-retry only real connectivity
// failures instead of silently swallowing "your email is invalid".
const isNetworkError = (error: unknown): boolean => error instanceof TypeError;

// All persistence is best-effort: localStorage can be unavailable (privacy mode) or full,
// and none of that should ever break the form itself.
const readStorage = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore — persistence is best-effort
  }
};

const removeStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

const createFieldInput = (field: FormField): HTMLElement => {
  const wrapper = document.createElement("div");
  wrapper.className = "dfsdk-field";

  const label = document.createElement("label");
  label.textContent = field.label + (field.isRequired ? " *" : "");
  label.htmlFor = field.id;
  // dir="auto" aligns each piece of text to the start/end of its own writing
  // direction based on its first strong character — Hebrew/Arabic labels align
  // to the end (right), English/Latin labels align to the start (left) — with
  // no language detection logic needed, and no assumption that the whole form
  // is one language (labels and answers can each be a different language).
  label.dir = "auto";
  wrapper.appendChild(label);

  let input: HTMLElement;

  switch (field.type) {
    case "TEXTAREA":
      input = document.createElement("textarea");
      break;
    case "SELECT": {
      const select = document.createElement("select");
      (field.options ?? []).forEach((option) => {
        const opt = document.createElement("option");
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
      });
      input = select;
      break;
    }
    case "RADIO":
    case "CHECKBOX": {
      const group = document.createElement("div");
      group.className = "dfsdk-options";
      (field.options ?? []).forEach((option) => {
        const optionLabel = document.createElement("label");
        optionLabel.dir = "auto";
        const optionInput = document.createElement("input");
        optionInput.type = field.type === "RADIO" ? "radio" : "checkbox";
        optionInput.name = field.id;
        optionInput.value = option;
        optionLabel.appendChild(optionInput);
        optionLabel.append(` ${option}`);
        group.appendChild(optionLabel);
      });
      input = group;
      break;
    }
    case "RATING": {
      // Radios numbered highest-to-lowest in DOM order, displayed in reverse
      // (CSS row-reverse) — the standard star-rating trick: a ~ sibling selector
      // can then highlight "this star and everything before it" purely in CSS,
      // for both :checked and :hover, with no JS needed beyond reading the value.
      const group = document.createElement("div");
      group.className = "dfsdk-rating";
      group.dir = "ltr";
      for (let star = RATING_STAR_COUNT; star >= 1; star--) {
        const starInput = document.createElement("input");
        starInput.type = "radio";
        starInput.name = field.id;
        starInput.value = String(star);
        starInput.id = `${field.id}-star-${star}`;
        const starLabel = document.createElement("label");
        starLabel.htmlFor = starInput.id;
        starLabel.textContent = "★";
        starLabel.title = `${star} / ${RATING_STAR_COUNT}`;
        group.append(starInput, starLabel);
      }
      input = group;
      break;
    }
    case "DATE": {
      // A native <input type="date"> renders its picker/segment order per the
      // browser's locale (e.g. yyyy/mm in some locales), which makes the visible
      // format inconsistent across visitors. Using a plain text input with a
      // pattern keeps the dd/mm/yyyy format identical everywhere.
      const dateInput = document.createElement("input");
      dateInput.type = "text";
      dateInput.placeholder = field.placeholder || "dd/mm/yyyy";
      dateInput.pattern = "\\d{2}/\\d{2}/\\d{4}";
      input = dateInput;
      break;
    }
    default: {
      const textInput = document.createElement("input");
      textInput.type =
        field.type === "EMAIL" ? "email" : field.type === "PHONE" ? "tel" : field.type === "NUMBER" ? "number" : "text";
      input = textInput;
    }
  }

  input.id = field.id;
  // RATING keeps its own forced "ltr" (star order is visual, not text-direction-based)
  // set above — everything else aligns to its own content via "auto".
  if (field.type !== "RATING" && "dir" in input) {
    (input as HTMLInputElement).dir = "auto";
  }
  if ("placeholder" in input && field.placeholder && field.type !== "DATE") {
    (input as HTMLInputElement).placeholder = field.placeholder;
  }
  if (field.isRequired && "required" in input) {
    (input as HTMLInputElement).required = true;
  }

  wrapper.appendChild(input);
  return wrapper;
};

const collectFieldValue = (field: FormField, root: HTMLElement): unknown => {
  if (field.type === "RADIO") {
    const checked = root.querySelector<HTMLInputElement>(`input[name="${field.id}"]:checked`);
    return checked?.value ?? null;
  }

  if (field.type === "RATING") {
    const checked = root.querySelector<HTMLInputElement>(`input[name="${field.id}"]:checked`);
    return checked ? Number(checked.value) : null;
  }

  if (field.type === "CHECKBOX") {
    const checked = root.querySelectorAll<HTMLInputElement>(`input[name="${field.id}"]:checked`);
    return Array.from(checked).map((el) => el.value);
  }

  const el = root.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    `[id="${field.id}"]`
  );
  return el?.value ?? null;
};

// Inverse of collectFieldValue, used to restore a saved draft/pending submission into the
// rendered inputs. Matches option elements by comparing .value in JS rather than by
// interpolating the (user-entered, arbitrary) value into a querySelector string.
const applyFieldValue = (field: FormField, root: HTMLElement, value: unknown): void => {
  if (value === null || value === undefined) return;

  if (field.type === "RADIO" || field.type === "RATING") {
    const options = Array.from(root.querySelectorAll<HTMLInputElement>(`input[name="${field.id}"]`));
    const match = options.find((el) => el.value === String(value));
    if (match) match.checked = true;
    return;
  }

  if (field.type === "CHECKBOX") {
    const values = Array.isArray(value) ? value.map(String) : [];
    root.querySelectorAll<HTMLInputElement>(`input[name="${field.id}"]`).forEach((el) => {
      el.checked = values.includes(el.value);
    });
    return;
  }

  const el = root.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    `[id="${field.id}"]`
  );
  if (el) el.value = String(value);
};

export class DynamicForm {
  private options: DynamicFormOptions;
  private container: HTMLElement;
  private schema?: FormSchema;
  private hasStarted = false;
  private hasSubmitted = false;
  private formEl?: HTMLFormElement;
  private noticeEl?: HTMLParagraphElement;
  private isPending = false;
  private retryTimer?: ReturnType<typeof setInterval>;

  constructor(options: DynamicFormOptions) {
    this.options = options;
    const target =
      typeof options.container === "string"
        ? document.querySelector<HTMLElement>(options.container)
        : options.container;

    if (!target) {
      throw new Error(`DynamicForm: container "${options.container}" not found`);
    }

    this.container = target;
    injectDefaultStyles();
    window.addEventListener("beforeunload", this.handleAbandon);
    window.addEventListener("online", this.handleOnline);
  }

  async mount(): Promise<void> {
    try {
      this.schema = await fetchForm(this.options.baseUrl, this.options.formId);
      this.renderForm(this.schema);
      this.restoreSavedState(this.schema);
      void trackEvent(this.options.baseUrl, this.options.formId, "VIEW");
    } catch (error) {
      this.options.onError?.(error as Error);
    }
  }

  unmount(): void {
    window.removeEventListener("beforeunload", this.handleAbandon);
    window.removeEventListener("online", this.handleOnline);
    this.stopRetryLoop();
    this.container.innerHTML = "";
  }

  private handleAbandon = (): void => {
    if (this.hasStarted && !this.hasSubmitted && !this.isPending) {
      void trackEvent(this.options.baseUrl, this.options.formId, "ABANDON");
    }
  };

  private handleOnline = (): void => {
    void this.attemptResubmit();
  };

  private draftKey(): string {
    return `dfsdk_draft_${this.options.formId}`;
  }

  private pendingKey(): string {
    return `dfsdk_pending_${this.options.formId}`;
  }

  private collectValues(schema: FormSchema, form: HTMLFormElement): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    schema.fields.forEach((field) => {
      data[field.id] = collectFieldValue(field, form);
    });
    return data;
  }

  // Runs once per mount: a pending submission (queued while offline on a previous visit)
  // takes priority over a plain draft, since it's the superset — the exact data the user
  // already tried to send — and immediately retries in case connectivity is back.
  private restoreSavedState(schema: FormSchema): void {
    if (!this.formEl) return;

    const pending = readStorage<PendingSubmission>(this.pendingKey());
    if (pending) {
      schema.fields.forEach((field) => applyFieldValue(field, this.formEl!, pending.data[field.id]));
      this.enterPendingState();
      void this.attemptResubmit();
      return;
    }

    const draft = readStorage<Record<string, unknown>>(this.draftKey());
    if (draft) {
      schema.fields.forEach((field) => applyFieldValue(field, this.formEl!, draft[field.id]));
    }
  }

  private showNotice(message: string): void {
    if (!this.noticeEl) return;
    this.noticeEl.textContent = message;
    this.noticeEl.hidden = false;
  }

  private setFormDisabled(disabled: boolean): void {
    this.formEl
      ?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement>(
        "input, textarea, select, button"
      )
      .forEach((el) => {
        el.disabled = disabled;
      });
  }

  // Freezes the form once a submission is queued: the data that's queued is exactly what
  // will be sent, so further edits are blocked rather than silently diverging from it.
  private enterPendingState(): void {
    if (this.isPending) return;
    this.isPending = true;
    this.showNotice(this.options.offlineMessage ?? DEFAULT_OFFLINE_MESSAGE);
    this.setFormDisabled(true);
    this.startRetryLoop();
  }

  private startRetryLoop(): void {
    if (this.retryTimer) return;
    this.retryTimer = setInterval(() => void this.attemptResubmit(), RETRY_INTERVAL_MS);
  }

  private stopRetryLoop(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = undefined;
    }
  }

  private clearSavedState(): void {
    removeStorage(this.draftKey());
    removeStorage(this.pendingKey());
    this.isPending = false;
    this.stopRetryLoop();
  }

  // Called on reconnect (the 'online' event), on a periodic fallback timer (some
  // environments don't fire 'online' reliably), and once right after restoring a pending
  // submission on mount, in case connectivity is already back by the time the page reloads.
  private async attemptResubmit(): Promise<void> {
    const schema = this.schema;
    const pending = readStorage<PendingSubmission>(this.pendingKey());
    if (!schema || !pending || this.hasSubmitted) return;

    try {
      await submitForm(this.options.baseUrl, this.options.formId, pending.data);
      this.hasSubmitted = true;
      this.clearSavedState();
      void trackEvent(this.options.baseUrl, this.options.formId, "SUBMIT", { wasOffline: true });
      this.renderSuccess(schema.theme);
      this.options.onSubmit?.(pending.data);
    } catch {
      // Still unreachable — leave it queued, the online listener and retry timer will try again.
    }
  }

  private markStarted(): void {
    if (!this.hasStarted) {
      this.hasStarted = true;
      void trackEvent(this.options.baseUrl, this.options.formId, "START");
    }
  }

  private renderForm(schema: FormSchema): void {
    this.container.innerHTML = "";

    const form = document.createElement("form");
    form.className = "dfsdk-form";
    this.applyTheme(form, schema.theme);

    if (schema.title) {
      const title = document.createElement("h2");
      title.textContent = schema.title;
      title.dir = "auto";
      form.appendChild(title);
    }

    if (schema.description) {
      const description = document.createElement("p");
      description.textContent = schema.description;
      description.dir = "auto";
      form.appendChild(description);
    }

    schema.fields
      .slice()
      .sort((a, b) => a.order - b.order)
      .forEach((field) => {
        const fieldEl = createFieldInput(field);
        fieldEl.addEventListener("focusin", () => {
          this.markStarted();
          void trackEvent(this.options.baseUrl, this.options.formId, "FIELD_FOCUS", {
            fieldId: field.id,
          });
        });
        fieldEl.addEventListener("change", () => {
          void trackEvent(this.options.baseUrl, this.options.formId, "FIELD_CHANGE", {
            fieldId: field.id,
          });
        });
        form.appendChild(fieldEl);
      });

    const notice = document.createElement("p");
    notice.className = "dfsdk-notice";
    notice.dir = "auto";
    notice.hidden = true;
    form.appendChild(notice);
    this.noticeEl = notice;

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = this.options.submitLabel ?? "Submit";
    form.appendChild(submitButton);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void this.handleSubmit(schema, form);
    });

    // Autosaves on every keystroke/selection so a draft survives a reload or closed tab
    // even before the user ever presses submit.
    form.addEventListener("input", () => {
      writeStorage(this.draftKey(), this.collectValues(schema, form));
    });

    this.formEl = form;
    this.container.appendChild(form);
  }

  // Theme colors/font are applied as CSS custom properties (with defaults baked into
  // the injected stylesheet) rather than ad-hoc inline styles, so every styled element
  // (inputs, option rows, submit button, success panel) picks them up consistently.
  private applyTheme(target: HTMLElement, theme: FormSchema["theme"]): void {
    if (!theme) return;
    if (theme.primaryColor) target.style.setProperty("--dfsdk-primary", theme.primaryColor);
    if (theme.backgroundColor) target.style.setProperty("--dfsdk-bg", theme.backgroundColor);
    if (theme.textColor) target.style.setProperty("--dfsdk-text", theme.textColor);
    if (theme.fontFamily) target.style.setProperty("--dfsdk-font", theme.fontFamily);
  }

  private renderSuccess(theme: FormSchema["theme"]): void {
    this.container.innerHTML = "";

    const panel = document.createElement("div");
    panel.className = "dfsdk-form dfsdk-success";
    this.applyTheme(panel, theme);

    const icon = document.createElement("div");
    icon.className = "dfsdk-success-icon";
    icon.textContent = "✓";

    const title = document.createElement("p");
    title.className = "dfsdk-success-title";
    title.textContent = "Thank you!";
    title.dir = "auto";

    const message = document.createElement("p");
    message.className = "dfsdk-success-message";
    message.textContent = this.options.successMessage ?? "Your response has been recorded.";
    message.dir = "auto";

    panel.append(icon, title, message);
    this.container.appendChild(panel);
  }

  private async handleSubmit(schema: FormSchema, form: HTMLFormElement): Promise<void> {
    const data = this.collectValues(schema, form);

    // Skip the network round-trip entirely when the browser already knows it's offline —
    // queue immediately instead of waiting on a doomed fetch to reject.
    if (!navigator.onLine) {
      writeStorage(this.pendingKey(), { data, savedAt: Date.now() } satisfies PendingSubmission);
      this.enterPendingState();
      return;
    }

    try {
      await submitForm(this.options.baseUrl, this.options.formId, data);
      this.hasSubmitted = true;
      this.clearSavedState();
      void trackEvent(this.options.baseUrl, this.options.formId, "SUBMIT");
      this.renderSuccess(schema.theme);
      this.options.onSubmit?.(data);
    } catch (error) {
      if (isNetworkError(error)) {
        writeStorage(this.pendingKey(), { data, savedAt: Date.now() } satisfies PendingSubmission);
        this.enterPendingState();
        return;
      }

      void trackEvent(this.options.baseUrl, this.options.formId, "ERROR", {
        message: (error as Error).message,
      });
      this.options.onError?.(error as Error);
    }
  }
}
