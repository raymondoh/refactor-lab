// src/lib/services/types/service-response.ts

export type ServiceOk<T> = { success: true; data: T };

export type ServiceErr = {
  success: false;
  error: string;
  status?: number;
};

export type ServiceResponse<T> = ServiceOk<T> | ServiceErr;

export function ok<T>(data: T): ServiceOk<T> {
  return { success: true, data };
}

export function err(error: string, status = 500): ServiceErr {
  return { success: false, error, status };
}
