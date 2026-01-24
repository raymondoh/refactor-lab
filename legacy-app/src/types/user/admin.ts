// types/user/admin.ts
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

export interface UpdateUserResponse extends ActionResponse {}

// Remove these unused types:
// - SearchUsersResponse (for commented out searchUsers function)
// - UpdateUserInput (not used anywhere)
// - UpdateUserRoleInput (for commented out updateUserRole function)
// - UpdateUserRoleResponse (for commented out updateUserRole function)
// - UserSearchState (not used anywhere)

// Also remove the UserData interface at the bottom if it's not used elsewhere
