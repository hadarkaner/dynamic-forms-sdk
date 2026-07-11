export interface FormSlot {
  id: string;
  key: string;
  formId: string | null;
  // Title of the assigned form's currently published version, for display only —
  // null both when unassigned and when the assigned form has nothing published.
  formTitle: string | null;
  createdAt: string;
  updatedAt: string;
}
