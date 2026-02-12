// src/actions/data-privacy/deletion.ts
"use server";

import { adminDataPrivacyService } from "@/lib/services/admin-data-privacy-service";
import { adminAuthService } from "@/lib/services/admin-auth-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logActivity } from "@/firebase/actions";
import type { DeleteAccountState } from "@/types/user/admin"; // <-- or wherever you placed it

function isTruthyFormValue(v: FormDataEntryValue | null): boolean {
  if (typeof v !== "string") return false;
  const s = v.toLowerCase();
  return s === "true" || s === "on" || s === "1" || s === "yes";
}

/**
 * User self-service deletion:
 * - If immediateDelete=true -> FULL delete of *their own* account (auth + user doc) + cleanup.
 * - Else -> mark deletionRequested flag only.
 */
export async function requestAccountDeletion(
  _prevState: DeleteAccountState | null,
  formData: FormData
): Promise<DeleteAccountState> {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    const confirm = String(formData.get("confirm") ?? "");
    if (confirm !== "DELETE") {
      return { success: false, error: "Please type DELETE to confirm" };
    }

    const immediateDelete = isTruthyFormValue(formData.get("immediateDelete"));

    // best-effort activity log
    try {
      await logActivity({
        userId,
        type: "account-deletion-request",
        description: immediateDelete ? "Account deletion requested (immediate)" : "Account deletion requested",
        status: "info",
        metadata: { immediateDelete }
      });
    } catch {}

    if (!immediateDelete) {
      const res = await adminDataPrivacyService.markDeletionRequested(userId);
      if (!res.success) return { success: false, error: res.error || "Failed to submit deletion request" };

      return { success: true, message: "Account deletion request submitted" };
    }

    // IMMEDIATE delete: cleanup + delete auth/doc
    const cleanupRes = await adminDataPrivacyService.deleteUserLikesAndProfileImage(userId);
    if (!cleanupRes.success) {
      return { success: false, error: cleanupRes.error || "Failed to cleanup user data" };
    }

    // Optional: delete user storage folder (non-fatal)
    await adminDataPrivacyService.deleteUserStorageFolder(`users/${userId}/`).catch(() => {});

    const delRes = await adminAuthService.deleteUserAuthAndDoc(userId);
    if (!delRes.success) {
      return { success: false, error: delRes.error || "Failed to delete account" };
    }

    return { success: true, message: "Account deleted", shouldRedirect: true };
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error requesting account deletion";
    console.error("Error requesting account deletion:", message);
    return { success: false, error: message };
  }
}
