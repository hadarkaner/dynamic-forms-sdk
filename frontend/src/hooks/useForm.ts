import { formService } from "../services/formService";
import { Form } from "../types/form";
import { useAsync } from "./useAsync";
import { useConnection } from "./useConnection";

export const useForm = (formId: string | undefined) => {
  const { apiKey } = useConnection();
  const { data: form, loading, error, refetch } = useAsync<Form | null>(
    () => formService.get(formId!),
    [apiKey, formId],
    null,
    Boolean(apiKey && formId)
  );

  return { form, loading, error, refetch };
};
