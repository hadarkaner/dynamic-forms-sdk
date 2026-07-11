import { formSlotService } from "../services/formSlotService";
import { FormSlot } from "../types/formSlot";
import { useAsync } from "./useAsync";
import { useConnection } from "./useConnection";

export const useFormSlots = () => {
  const { apiKey } = useConnection();
  const { data: slots, loading, error, refetch } = useAsync<FormSlot[]>(
    () => formSlotService.list(),
    [apiKey],
    [],
    Boolean(apiKey)
  );

  return { slots, loading, error, refetch };
};
