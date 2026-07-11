import { submissionService } from "../services/submissionService";
import { FormSubmission } from "../types/submission";
import { useAsync } from "./useAsync";
import { useConnection } from "./useConnection";

export const useSubmissions = (formId: string | undefined) => {
  const { apiKey } = useConnection();
  const { data: submissions, loading, error, refetch } = useAsync<FormSubmission[]>(
    () => submissionService.list(formId!),
    [apiKey, formId],
    [],
    Boolean(apiKey && formId)
  );

  return { submissions, loading, error, refetch };
};
