// src/actions/data-privacy/admin.ts
"use server";

import { adminDataPrivacyService } from "@/lib/services/admin-data-privacy-service";
import { adminUserService } from "@/lib/services/admin-user-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logActivity } from "@/firebase/actions";
import { revalidatePath } from "next/cache";

// Get deletion requests
export async function getDeletionRequests() {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // ✅ Admin check via service
    // NOTE: assumes adminUserService.getUserById exists. If yours is named differently, tell me the method name.
    const adminRes = await adminUserService.getUserById(session.user.id);
    if (!adminRes.success || !adminRes.data) {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    const adminUser = adminRes.data as any;
    if (adminUser.role !== "admin") {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    // ✅ List requests via data-privacy service
    const listRes = await adminDataPrivacyService.listDeletionRequests();
    if (!listRes.success) {
      return { success: false, error: listRes.error };
    }

    // Keep response shape similar to your original `requests`
    return { success: true, requests: listRes.data.users };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error getting deletion requests";
    console.error("Error getting deletion requests:", message);
    return { success: false, error: message };
  }
}

// Process deletion request (admin)
export async function processDeletionRequest(userId: string, action: "approve" | "reject") {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // ✅ Admin check via service
    const adminRes = await adminUserService.getUserById(session.user.id);
    if (!adminRes.success || !adminRes.data) {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    const adminUser = adminRes.data as any;
    if (adminUser.role !== "admin") {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    if (action === "approve") {
      const { deleteUserAccount } = await import("@/actions/auth/delete");
      const result = await deleteUserAccount(userId);

      if (!result.success) return result;

      await logActivity({
        userId: session.user.id,
        type: "admin-action",
        description: `Admin approved account deletion for user ${userId}`,
        status: "success",
        metadata: { targetUserId: userId }
      });
    } else {
      // ✅ Reject deletion via service (no direct Firestore here)
      const rejectRes = await adminUserService.patchUser(userId, {
        deletionRequested: false,
        deletionRequestedAt: null,
        deletionRejectedAt: new Date(),
        deletionRejectedBy: session.user.id
      });

      if (!rejectRes.success) {
        return { success: false, error: rejectRes.error };
      }

      await logActivity({
        userId: session.user.id,
        type: "admin-action",
        description: `Admin rejected account deletion for user ${userId}`,
        status: "info",
        metadata: { targetUserId: userId }
      });
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error processing deletion request";
    console.error("Error processing deletion request:", message);
    return { success: false, error: message };
  }
}
