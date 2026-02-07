// src/actions/user/admin.ts
"use server";

// ================= Imports =================
import { revalidatePath } from "next/cache";

import { adminAuthService } from "@/lib/services/admin-auth-service";
import { adminUserService } from "@/lib/services/admin-user-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logActivity } from "@/firebase/actions";
import { logger } from "@/utils/logger";
import { requireAdmin } from "@/actions/_helpers/require-admin";

import type {
  CreateUserInput,
  CreateUserResponse,
  FetchUsersResponse,
  UpdateUserResponse,
  FetchUserByIdResponse,
  DeleteUserResponse,
  AdminUpdateUserInput
} from "@/types/user/admin";

// ================= Admin User Actions =================

/**
 * Create a new user (admin only)
 */
/**
 * Create a new user (admin only)
 */
export async function createUser({ email, password, name, role }: CreateUserInput): Promise<CreateUserResponse> {
  // ✅ centralised gate
  const gate = await requireAdmin();
  if (!gate.success) return { success: false, error: gate.error };

  try {
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
    try {
      await logActivity({
        userId: gate.userId,
        type: "admin-action",
        description: `Created a new user (${email})`,
        status: "success",
        metadata: {
          createdUserId: newUserId,
          createdUserEmail: email,
          createdUserRole: role ?? "user"
        }
      });
    } catch {
      // best-effort: don't fail the main action if logging fails
    }

    revalidatePath("/admin/users");
    return { success: true, userId: newUserId };
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error";

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
  const gate = await requireAdmin();
  if (!gate.success) return { success: false, error: gate.error };

  const result = await adminUserService.listUsers(limit, offset);

  if (!result.success) {
    logger({
      type: "error",
      message: "Error in fetchUsers",
      metadata: { error: result.error, limit, offset },
      context: "admin-users"
    });

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
  const gate = await requireAdmin();
  if (!gate.success) return { success: false, error: gate.error };

  if (!userId) return { success: false, error: "User ID is required" };

  const result = await adminUserService.getUserById(userId);

  if (!result.success) {
    logger({
      type: "error",
      message: "Error in fetchUserById",
      metadata: { error: result.error, userId },
      context: "admin-users"
    });

    return { success: false, error: result.error };
  }

  return { success: true, user: result.data.user };
}

/**
 * Update user fields (admin only)
 */
export async function updateUser(userId: string, userData: AdminUpdateUserInput): Promise<UpdateUserResponse> {
  // ✅ centralised gate
  const gate = await requireAdmin();
  if (!gate.success) return { success: false, error: gate.error };

  if (!userId) return { success: false, error: "User ID is required" };

  try {
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

    // best-effort log (don’t fail if logging fails)
    try {
      await logActivity({
        userId: gate.userId,
        type: "admin-update-user",
        description: `Admin updated user ${userId}`,
        status: "success",
        metadata: {
          targetUserId: userId,
          updatedFields: Object.keys(userData ?? {})
        }
      });
    } catch {}

    revalidatePath("/admin/users");

    logger({
      type: "info",
      message: `Updated user ${userId}`,
      context: "admin-users"
    });

    return { success: true };
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error";

    logger({
      type: "error",
      message: "Unexpected error in updateUser",
      metadata: { error: message, userId },
      context: "admin-users"
    });

    return { success: false, error: message };
  }
}

/**
 * Delete Firestore user doc only (admin only)
 * Keep this ONLY if you still need doc-only deletes.
 */
/**
 * Delete Firestore user doc only (admin only)
 */
export async function deleteUserDoc(userId: string): Promise<DeleteUserResponse> {
  // ✅ centralised gate
  const gate = await requireAdmin();
  if (!gate.success) return { success: false, error: gate.error };

  if (!userId) return { success: false, error: "User ID is required" };

  try {
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

    // best-effort audit log
    try {
      await logActivity({
        userId: gate.userId,
        type: "admin-delete-user-doc",
        description: `Admin deleted Firestore user doc ${userId}`,
        status: "success",
        metadata: { targetUserId: userId }
      });
    } catch {}

    revalidatePath("/admin/users");

    logger({
      type: "info",
      message: `Deleted Firestore user doc ${userId}`,
      context: "admin-users"
    });

    return { success: true };
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error deleting Firestore user doc";

    logger({
      type: "error",
      message: "Unexpected error in deleteUserDoc",
      metadata: { error: message, userId },
      context: "admin-users"
    });

    return { success: false, error: message };
  }
}

// ================= Canonical admin delete =================

/**
 * Canonical "delete user" for admins.
 * Uses adminUserService.deleteUserFully() (single source of truth).
 */
export type DeleteUserResult = { success: true } | { success: false; error: string };

export async function deleteUserAsAdmin(userId: string): Promise<DeleteUserResult> {
  // ✅ centralised gate
  const gate = await requireAdmin();
  if (!gate.success) return { success: false, error: gate.error };

  if (!userId) return { success: false, error: "User ID is required" };

  try {
    const res = await adminUserService.deleteUserFully(userId);

    if (!res.success) {
      logger({
        type: "error",
        message: "Error in deleteUserAsAdmin",
        metadata: { error: res.error, userId },
        context: "admin-users"
      });

      return { success: false, error: res.error || "Failed to delete user" };
    }

    // best-effort activity log
    try {
      await logActivity({
        userId: gate.userId,
        type: "admin-delete-user",
        description: `Admin deleted user ${userId}`,
        status: "success",
        metadata: { targetUserId: userId }
      });
    } catch {}

    revalidatePath("/admin/users");

    logger({
      type: "info",
      message: `Admin deleted user ${userId}`,
      context: "admin-users"
    });

    return { success: true };
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error deleting user";

    logger({
      type: "error",
      message: "Unexpected error in deleteUserAsAdmin",
      metadata: { error: message, userId },
      context: "admin-users"
    });

    return { success: false, error: message };
  }
}
