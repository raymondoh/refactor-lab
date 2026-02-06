// src/types/user/admin.ts
import type { User, UserRole } from "../models/user";
import type { ActionResponse } from "../common";

export interface CreateUserInput {
  email: string;
  password?: string;
  name?: string;
  role?: UserRole;
}

export interface CreateUserResponse extends ActionResponse {
  userId?: string;
}

export interface FetchUsersResponse extends ActionResponse {
  users?: User[];
  total?: number;
}

export interface FetchUserByIdResponse extends ActionResponse {
  user?: User;
}

// Added this type definition
export interface AdminUpdateUserInput extends Partial<User> {
  // Allow additional fields if necessary, or keep strict to User model
  [key: string]: unknown;
}

export type UpdateUserResponse = ActionResponse;
export type DeleteUserResponse = ActionResponse;
export type DeleteUserAccountResponse = ActionResponse;
