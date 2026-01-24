// src/types/auth/index.ts

/**
 * Auth Types Index
 *
 * This file explicitly exports all auth-related types from the auth directory.
 * Using this index file makes imports clearer and helps with IDE auto-imports.
 */

// Login types
export type { LoginState, LoginResponse } from "./login";

// Registration types
export type { RegisterState } from "./register";

// Password management types
export type {
  ResetPasswordState,
  UpdatePasswordState,
  LogPasswordResetInput,
  GetUserIdByEmailInput,
  GetUserIdByEmailResponse,
  UpdatePasswordHashInput
} from "./password";

// Email verification types
export * from "./email-verification";

// Firebase auth types
export * from "./firebase-auth";
