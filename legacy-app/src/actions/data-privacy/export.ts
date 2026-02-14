// src/actions/data-privacy/export.ts
"use server";

import { adminDataPrivacyService } from "@/lib/services/admin-data-privacy-service";
import { ok, fail } from "@/lib/services/service-result";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

export async function requestDataExportAction() {
  const { auth } = await import("@/auth");
  const session = await auth();

  if (!session?.user?.id) {
    return fail("UNAUTHENTICATED", "Authentication required for data export.");
  }

  try {
    // FIX: Changed from requestExport to exportUserData based on build error hint
    const result = await adminDataPrivacyService.exportUserData(session.user.id);

    if (!result.success) {
      return fail("UNKNOWN", result.error || "Could not process export request.");
    }

    return ok({
      success: true,
      message: "Your data export has been requested."
    });
  } catch (error) {
    const message = isFirebaseError(error) ? firebaseError(error) : "Export request failed.";
    return fail("UNKNOWN", message);
  }
}

// FIX: Export alias for DataExport.tsx component
export { requestDataExportAction as exportUserData };
