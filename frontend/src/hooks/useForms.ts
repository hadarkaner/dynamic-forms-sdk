import { formService } from "../services/formService";
import { Form } from "../types/form";
import { useAsync } from "./useAsync";
import { useConnection } from "./useConnection";

export const useForms = () => {
  const { apiKey } = useConnection();
  const { data: forms, loading, error, refetch } = useAsync<Form[]>(
    () => formService.list(),
    [apiKey],
    [],
    Boolean(apiKey)
  );

  return { forms, loading, error, refetch };
};
