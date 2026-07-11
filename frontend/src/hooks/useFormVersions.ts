import { formService } from "../services/formService";
import { FormVersion } from "../types/form";
import { useAsync } from "./useAsync";
import { useConnection } from "./useConnection";

export const useFormVersions = (formId: string | undefined) => {
  const { apiKey } = useConnection();
  const { data: versions, loading, error, refetch } = useAsync<FormVersion[]>(
    () => formService.listVersions(formId!),
    [apiKey, formId],
    [],
    Boolean(apiKey && formId)
  );

  return { versions, loading, error, refetch };
};
