// src/actions/data-privacy/deletion.ts
"use server";

import { adminDataPrivacyService } from "@/lib/services/admin-data-privacy-service";
import { adminAuthService } from "@/lib/services/admin-auth-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logServerEvent } from "@/lib/services/logging-service";
import { ok, fail } from "@/lib/services/service-result";

/**
 * Helper to parse truthy values from FormData
 */
function isTruthyFormValue(v: FormDataEntryValue | null): boolean {
  if (typeof v !== "string") return false;
  const s = v.toLowerCase();
  return s === "true" || s === "on" || s === "1" || s === "yes";
}

/**
 * User self-service account deletion.
 * Refactored to use ServiceResult and dynamic auth import.
 */
export async function requestAccountDeletionAction(formData: FormData) {
  try {
    // 1) Dynamic import of auth inside the function scope for Edge compatibility
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return fail("UNAUTHENTICATED", "You must be logged in to delete your account.");
    }

    const userId = session.user.id;

    // 2) Validation
    const confirm = String(formData.get("confirm") ?? "");
    if (confirm !== "DELETE") {
      return fail("VALIDATION", "Please type DELETE to confirm the deletion.");
    }

    const immediateDelete = isTruthyFormValue(formData.get("immediateDelete"));

    // 3) Conditional Deletion Logic
    if (!immediateDelete) {
      // Mark for future deletion
      const res = await adminDataPrivacyService.markDeletionRequested(userId);
      if (!res.ok) return fail("UNKNOWN", res.error || "Failed to submit deletion request.");

      await logServerEvent({
        type: `deletion:requested`,
        message: `User ${userId} requested account deletion`,
        userId,
        context: "data-privacy"
      });

      return ok({ message: "Account deletion request submitted." });
    }

    // 4) IMMEDIATE delete: cleanup + delete auth/doc
    // Run cleanup of likes and profile images first
    const cleanupRes = await adminDataPrivacyService.deleteUserLikesAndProfileImage(userId);
    if (!cleanupRes.ok) {
      return fail("UNKNOWN", cleanupRes.error || "Failed to cleanup user data.");
    }

    // Best-effort storage cleanup (non-fatal)
    await adminDataPrivacyService.deleteUserStorageFolder(`users/${userId}/`).catch(() => {});

    // Final step: Delete the Auth record and the User document
    const delRes = await adminAuthService.deleteUserAuthAndDoc(userId);
    if (!delRes.ok) {
      return fail("UNKNOWN", delRes.error || "Failed to delete account auth.");
    }

    await logServerEvent({
      type: `deletion:immediate`,
      message: `User ${userId} deleted their own account immediately`,
      context: "data-privacy"
    });

    return ok({ message: "Account deleted", shouldRedirect: true });
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "An unexpected error occurred during account deletion.";

    return fail("UNKNOWN", message);
  }
}
// Add this to the bottom of src/actions/data-privacy/deletion.ts
export { requestAccountDeletionAction as requestAccountDeletion };
