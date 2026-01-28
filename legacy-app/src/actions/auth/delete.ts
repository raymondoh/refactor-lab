// src/actions/auth/delete.ts
"use server";

import { adminAuthService } from "@/lib/services/admin-auth-service";
import { adminDataPrivacyService } from "@/lib/services/admin-data-privacy-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logActivity } from "@/firebase/actions";

// Delete user account
export async function deleteUserAccount(userId: string) {
  try {
    // Log the deletion request
    await logActivity({
      userId,
      type: "account-deletion",
      description: "Account deletion requested",
      status: "info"
    });

    // Delete likes + profile image (non-fatal image delete handled inside service)
    const cleanupRes = await adminDataPrivacyService.deleteUserLikesAndProfileImage(userId);
    if (!cleanupRes.success) {
      return { success: false, error: cleanupRes.error };
    }

    // Optional: delete storage folder if you store user assets under a prefix
    // Change prefix to match your real storage layout, or remove if not used.
    await adminDataPrivacyService.deleteUserStorageFolder(`users/${userId}/`).catch(() => {});

    // Delete user doc + auth user
    const delRes = await adminAuthService.deleteUserAuthAndDoc(userId);
    if (!delRes.success) {
      return { success: false, error: delRes.error };
    }

    // Log successful deletion
    await logActivity({
      userId: "system",
      type: "account-deletion",
      description: `User account ${userId} deleted`,
      status: "success",
      metadata: { deletedUserId: userId }
    });

    return { success: true };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error deleting user account";
    console.error("Error deleting user account:", message);
    return { success: false, error: message };
  }
}
