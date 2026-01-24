// types/auth/password.ts
import type { ActionResponse } from "../common/response";
import type { FirebaseError } from "firebase/app";
//import { UserRole } from "../user/common"; // if needed elsewhere

export interface ResetPasswordState {
  success: boolean;
  message?: string;
  //email: string;
  error?: string;
}

export interface UpdatePasswordState {
  success: boolean;
  message?: string;
  error?: string | FirebaseError;
}

// ✅ Server-side action types (ADD these below)
export interface LogPasswordResetInput {
  email: string;
}

export interface GetUserIdByEmailInput {
  email: string;
}

export interface GetUserIdByEmailResponse extends ActionResponse {
  userId?: string;
}

export interface UpdatePasswordHashInput {
  userId: string;
  newPassword: string;
}

export type ResetPasswordResponse = ActionResponse;
