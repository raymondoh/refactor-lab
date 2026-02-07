// src/actions/auth/delete.ts
"use server";

import { adminUserService } from "@/lib/services/admin-user-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logActivity } from "@/firebase/actions";

/**
 * Delete user account (FULL delete).
 *
 * NOTE:
 * - This is now a thin wrapper around adminUserService.deleteUserFully()
 * - Prefer using src/actions/user/admin.ts -> deleteUserAsAdmin() from admin UI.
 * - Consider converting this to "deleteMyAccount()" later (no userId param).
 */
export async function deleteUserAccount(userId: string) {
  try {
    // Log the deletion request (best-effort)
    try {
      await logActivity({
        userId,
        type: "account-deletion",
        description: "Account deletion requested",
        status: "info"
      });
    } catch {}

    const res = await adminUserService.deleteUserFully(userId);

    if (!res.success) {
      return { success: false, error: res.error || "Failed to delete user account" };
    }

    // Log successful deletion (best-effort)
    try {
      await logActivity({
        userId: "system",
        type: "account-deletion",
        description: `User account ${userId} deleted`,
        status: "success",
        metadata: { deletedUserId: userId }
      });
    } catch {}

    return { success: true };
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error deleting user account";
    console.error("Error deleting user account:", message);
    return { success: false, error: message };
  }
}
