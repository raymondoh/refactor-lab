//src/types/auth/register.ts
import { ActionResponse } from "../common/response";
import { UserRole } from "../user/common";

export interface RegisterData {
  userId: string;
  email: string;
  role: UserRole;
  requiresVerification: boolean;
  password: string;
}

export type RegisterResponse = ActionResponse<RegisterData>;
export type RegisterState = RegisterResponse | null;
