import { apiRequest } from "./apiClient";
import { FormSlot } from "../types/formSlot";

export const formSlotService = {
  list: (): Promise<FormSlot[]> => apiRequest<FormSlot[]>("/form-slots"),

  create: (key: string, formId?: string | null): Promise<FormSlot> =>
    apiRequest<FormSlot>("/form-slots", { method: "POST", body: JSON.stringify({ key, formId }) }),

  assign: (id: string, formId: string | null): Promise<FormSlot> =>
    apiRequest<FormSlot>(`/form-slots/${id}`, { method: "PATCH", body: JSON.stringify({ formId }) }),

  remove: (id: string): Promise<void> => apiRequest<void>(`/form-slots/${id}`, { method: "DELETE" }),
};
