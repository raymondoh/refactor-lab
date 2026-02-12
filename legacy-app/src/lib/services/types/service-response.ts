// src/lib/services/types/service-response.ts

export type ServiceResponse<T> = { success: true; data: T } | { success: false; error: string; status?: number };
