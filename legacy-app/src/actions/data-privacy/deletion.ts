// src/actions/data-privacy/deletion.ts
"use server";

import { adminDataPrivacyService } from "@/lib/services/admin-data-privacy-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logActivity } from "@/firebase/actions";

// Request account deletion
export async function requestAccountDeletion() {
  try {
    const { auth: userAuth } = await import("@/auth");
    const session = await userAuth();

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    await logActivity({
      userId,
      type: "account-deletion-request",
      description: "Account deletion requested",
      status: "info"
    });

    // ✅ Service-driven flag update
    const res = await adminDataPrivacyService.markDeletionRequested(userId);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    return { success: true };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error requesting account deletion";
    console.error("Error requesting account deletion:", message);
    return { success: false, error: message };
  }
}

// Cancel account deletion request
// Confirm and execute account deletion
