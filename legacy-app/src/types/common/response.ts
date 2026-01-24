// types/common/response.ts
export interface ActionResponse<T = undefined> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}
