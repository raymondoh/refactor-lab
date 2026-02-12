export type ServiceErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "VALIDATION" | "NOT_FOUND" | "UNKNOWN";

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: ServiceErrorCode; status?: number };

export function ok<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(code: ServiceErrorCode, error: string, status?: number): ServiceResult<T> {
  return { ok: false, code, error, status };
}
