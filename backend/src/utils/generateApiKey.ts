import { randomBytes } from "crypto";

export const generateApiKey = (): string => {
  return `dfsdk_${randomBytes(24).toString("hex")}`;
};
