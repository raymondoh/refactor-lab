import { ActionResponse } from "../common/response";
import { UserRole } from "../models/user";

export interface LoginData {
  userId: string;
  email: string;
  role: UserRole;
  customToken: string;
  emailVerified: boolean;
}

export type LoginResponse = ActionResponse<LoginData>;

// This is the client-side state (optional, for use with useActionState)
export type LoginState = LoginResponse | null;
