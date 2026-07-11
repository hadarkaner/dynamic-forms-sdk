import { FormFieldInput } from "../types/form";

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  title: string;
  formDescription?: string;
  fields: FormFieldInput[];
}

type FieldTemplate = Omit<FormFieldInput, "order">;

const field = (
  label: string,
  type: FormFieldInput["type"],
  options: Partial<FieldTemplate> = {}
): FieldTemplate => ({
  label,
  type,
  isRequired: false,
  ...options,
});

const withOrder = (fields: FieldTemplate[]): FormFieldInput[] =>
  fields.map((f, order) => ({ ...f, order }));

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "contact",
    name: "צור קשר",
    description: "טופס יצירת קשר בסיסי — שם, פרטי התקשרות והודעה.",
    title: "צור קשר",
    fields: withOrder([
      field("שם מלא", "TEXT", { isRequired: true }),
      field("אימייל", "EMAIL", { isRequired: true }),
      field("טלפון", "PHONE"),
      field("הודעה", "TEXTAREA", { isRequired: true }),
    ]),
  },
  {
    id: "feedback",
    name: "משוב",
    description: "איסוף משוב על שירות, מוצר או אירוע.",
    title: "משוב",
    fields: withOrder([
      field("שם (אופציונלי)", "TEXT"),
      field("עד כמה היית מרוצה?", "RADIO", {
        isRequired: true,
        options: ["מצוין", "טוב", "סביר", "לא טוב"],
      }),
      field("מה היה לך לב? מה אפשר לשפר?", "TEXTAREA"),
    ]),
  },
  {
    id: "survey",
    name: "סקר",
    description: "סקר עם כמה שאלות בחירה ושדה תגובה חופשי.",
    title: "סקר",
    fields: withOrder([
      field("גיל", "SELECT", { options: ["מתחת ל-18", "18-24", "25-34", "35-44", "45+"] }),
      field("איך הגעת אלינו?", "CHECKBOX", {
        options: ["חברים", "רשתות חברתיות", "חיפוש בגוגל", "אחר"],
      }),
      field("הערות נוספות", "TEXTAREA"),
    ]),
  },
  {
    id: "registration",
    name: "הרשמה",
    description: "טופס הרשמה לקורס, קבוצה או חוג.",
    title: "הרשמה",
    fields: withOrder([
      field("שם מלא", "TEXT", { isRequired: true }),
      field("אימייל", "EMAIL", { isRequired: true }),
      field("טלפון", "PHONE", { isRequired: true }),
      field("תאריך לידה", "DATE"),
    ]),
  },
  {
    id: "event-invitation",
    name: "הזמנת אירוע",
    description: "אישור הגעה (RSVP) לאירוע, עם מספר אורחים והערות.",
    title: "אישור הגעה",
    fields: withOrder([
      field("שם מלא", "TEXT", { isRequired: true }),
      field("אימייל", "EMAIL"),
      field("האם תגיע/י?", "RADIO", { isRequired: true, options: ["כן", "לא", "אולי"] }),
      field("כמה אורחים מצטרפים?", "NUMBER"),
      field("הגבלות תזונתיות", "TEXTAREA"),
    ]),
  },
  {
    id: "questionnaire",
    name: "שאלון",
    description: "שאלון עם שאלות רב-בחירה ושאלה פתוחה בסוף.",
    title: "שאלון",
    fields: withOrder([
      field("שאלה 1", "RADIO", { options: ["תשובה א", "תשובה ב", "תשובה ג"] }),
      field("שאלה 2", "CHECKBOX", { options: ["אפשרות 1", "אפשרות 2", "אפשרות 3"] }),
      field("שאלה פתוחה", "TEXTAREA"),
    ]),
  },
];
