"use server";

// ================= Imports =================
import { createUserInFirebase } from "@/firebase/admin/auth";
import { logActivity } from "@/firebase/actions";
import { revalidatePath } from "next/cache";
import { logger } from "@/utils/logger";
import { adminUserService } from "@/lib/services/admin-user-service";

import type {
  CreateUserInput,
  CreateUserResponse,
  FetchUsersResponse,
  FetchUserByIdResponse,
  UpdateUserResponse,
  DeleteUserResponse,
  DeleteUserAccountResponse,
  UserRole
} from "@/types/user";

type AdminUpdateUserInput = {
  name?: string;
  role?: UserRole;
};

// ================= Admin User Actions =================

/**
 * Create a new user (admin only)
 */
export async function createUser({ email, password, name, role }: CreateUserInput): Promise<CreateUserResponse> {
  const { auth } = await import("@/auth");
  const session = await auth();

  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const result = await createUserInFirebase({
      email,
      password,
      displayName: name,
      createdBy: session.user.id,
      role
    });

    if (!result.success) {
      return { success: false, error: result.error || "Failed to create user" };
    }

    if (!result.data?.uid) {
      return { success: false, error: "Failed to get user ID from created user" };
    }

    await logActivity({
      userId: session.user.id,
      type: "admin-action",
      description: `Created a new user (${email})`,
      status: "success",
      metadata: {
        createdUserId: result.data.uid,
        createdUserEmail: email,
        createdUserRole: role || "user"
      }
    });

    revalidatePath("/admin/users");

    return { success: true, userId: result.data.uid };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    logger({
      type: "error",
      message: "Error in createUser",
      metadata: { error: message },
      context: "admin-users"
    });

    return { success: false, error: message };
  }
}

/**
 * Fetch users (admin only)
 */
export async function fetchUsers(limit = 10, offset = 0): Promise<FetchUsersResponse> {
  const result = await adminUserService.listUsers(limit, offset);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    users: result.data.users,
    total: result.data.total
  };
}

/**
 * Fetch a single user (admin only)
 */
export async function fetchUserById(userId: string): Promise<FetchUserByIdResponse> {
  const result = await adminUserService.getUserById(userId);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, user: result.data.user };
}

/**
 * Update user fields (admin only)
 */
export async function updateUser(userId: string, userData: AdminUpdateUserInput): Promise<UpdateUserResponse> {
  const result = await adminUserService.updateUser(userId, userData);

  if (!result.success) {
    logger({
      type: "error",
      message: "Error in updateUser",
      metadata: { error: result.error, userId },
      context: "admin-users"
    });

    return { success: false, error: result.error };
  }

  revalidatePath("/admin/users");

  logger({
    type: "info",
    message: `Updated user ${userId}`,
    context: "admin-users"
  });

  return { success: true };
}

/**
 * Delete Firestore user doc only (admin only)
 */
export async function deleteUserDoc(userId: string): Promise<DeleteUserResponse> {
  const result = await adminUserService.deleteUserDoc(userId);

  if (!result.success) {
    logger({
      type: "error",
      message: "Error in deleteUserDoc",
      metadata: { error: result.error, userId },
      context: "admin-users"
    });

    return { success: false, error: result.error };
  }

  revalidatePath("/admin/users");

  logger({
    type: "info",
    message: `Deleted Firestore user doc ${userId}`,
    context: "admin-users"
  });

  return { success: true };
}

/**
 * Delete user account (admin only) - Auth + Firestore doc (Option A)
 */
export async function deleteUserAccount(userId: string): Promise<DeleteUserAccountResponse> {
  const result = await adminUserService.deleteUserAccount(userId);

  if (!result.success) {
    logger({
      type: "error",
      message: "Error in deleteUserAccount",
      metadata: { error: result.error, userId },
      context: "admin-users"
    });

    return { success: false, error: result.error };
  }

  revalidatePath("/admin/users");

  logger({
    type: "info",
    message: `Deleted user account ${userId}`,
    context: "admin-users"
  });

  return { success: true };
}
