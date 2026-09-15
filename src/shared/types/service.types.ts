import type { AxiosResponse } from "axios";

export type ServiceResponse<T = AxiosResponse> = {
  success: boolean;
  data?: T;
  error?: string;
};
