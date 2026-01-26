import type { User } from "./common";
import type { ActionResponse } from "../common";
import type { UserRole } from "./common";

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

export type UpdateUserResponse = ActionResponse;

export type DeleteUserResponse = ActionResponse;

export type DeleteUserAccountResponse = ActionResponse;
