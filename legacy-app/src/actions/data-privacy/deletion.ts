// src/actions/data-privacy/deletion.ts
"use server";

import { adminDataPrivacyService } from "@/lib/services/admin-data-privacy-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logActivity } from "@/firebase/actions";

import type { DeleteAccountState } from "@/types/data-privacy"; // adjust path to wherever you placed these types

function parseBooleanFormValue(v: FormDataEntryValue | null): boolean {
  if (v === null) return false;
  if (typeof v === "string") return v === "true" || v === "on" || v === "1";
  return false;
}

function asDeleteAccountError(error: unknown, fallback: string): DeleteAccountState {
  const message = isFirebaseError(error) ? firebaseError(error) : error instanceof Error ? error.message : fallback;

  return { success: false, error: message };
}

// Request account deletion
export async function requestAccountDeletion(
  _prev: DeleteAccountState | null,
  formData: FormData
): Promise<DeleteAccountState> {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    const userId = session.user.id;

    const immediateDelete = parseBooleanFormValue(formData.get("immediateDelete"));

    await logActivity({
      userId,
      type: "account-deletion-request",
      description: `Account deletion requested${immediateDelete ? " (immediate)" : ""}`,
      status: "info",
      metadata: { immediateDelete }
    });

    // Service-driven flag update (you can extend this to store requestedAt/status too)
    const res = await adminDataPrivacyService.markDeletionRequested(userId);
    if (!res.success) return { success: false, error: res.error ?? "Failed to request deletion" };

    return {
      success: true,
      message: "Account deletion request submitted",
      shouldRedirect: immediateDelete
    };
  } catch (error: unknown) {
    console.error("Error requesting account deletion:", error);
    return asDeleteAccountError(error, "Unknown error requesting account deletion");
  }
}
