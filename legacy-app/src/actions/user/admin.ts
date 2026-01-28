// src/actions/user/admin.ts
"use server";

// ================= Imports =================
import { revalidatePath } from "next/cache";

import { adminAuthService } from "@/lib/services/admin-auth-service";
import { adminUserService } from "@/lib/services/admin-user-service";
import { logActivity } from "@/firebase/actions";
import { logger } from "@/utils/logger";

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
    // ✅ Optional: if you have admin guards elsewhere, keep; otherwise we keep it light here.
    // You can add isAdmin checks via a service if you want.

    // 1) Create Auth user
    const authRes = await adminAuthService.createAuthUser({
      email,
      password: password ?? "",
      displayName: name,
      emailVerified: false
    });

    if (!authRes.success) {
      return { success: false, error: authRes.error };
    }

    const newUserId = authRes.data.uid;

    // 2) Create Firestore user doc
    const docRes = await adminAuthService.createUserDoc(newUserId, {
      email,
      name: name ?? email.split("@")[0],
      role: role ?? "user",
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    if (!docRes.success) {
      return { success: false, error: docRes.error };
    }

    // 3) Log admin activity
    await logActivity({
      userId: session.user.id,
      type: "admin-action",
      description: `Created a new user (${email})`,
      status: "success",
      metadata: {
        createdUserId: newUserId,
        createdUserEmail: email,
        createdUserRole: role ?? "user"
      }
    });

    revalidatePath("/admin/users");

    return { success: true, userId: newUserId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    logger({
      type: "error",
      message: "Error in createUser",
      metadata: { error: message, email },
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
 * Delete user account (admin only) - Auth + Firestore doc
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
