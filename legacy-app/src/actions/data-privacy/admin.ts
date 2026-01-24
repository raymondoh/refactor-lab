"use server";

import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logActivity } from "@/firebase/log/logActivity";
import { revalidatePath } from "next/cache";

// Get deletion requests
export async function getDeletionRequests() {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user is admin
    const db = getAdminFirestore();
    const userDoc = await db.collection("users").doc(session.user.id).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== "admin") {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    // Get all users with deletion requests
    const snapshot = await db.collection("users").where("deletionRequested", "==", true).get();

    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, requests };
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
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user is admin
    const db = getAdminFirestore();
    const adminDoc = await db.collection("users").doc(session.user.id).get();
    const adminData = adminDoc.data();

    if (!adminData || adminData.role !== "admin") {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    if (action === "approve") {
      // Import the deletion function - use the correct function name from the file
      const { deleteUserAccount } = await import("@/actions/auth/delete");
      const result = await deleteUserAccount(userId);

      if (!result.success) {
        return result;
      }

      await logActivity({
        userId: session.user.id,
        type: "admin-action",
        description: `Admin approved account deletion for user ${userId}`,
        status: "success",
        metadata: { targetUserId: userId }
      });
    } else {
      // Reject the deletion request
      await db.collection("users").doc(userId).update({
        deletionRequested: false,
        deletionRequestedAt: null,
        deletionRejectedAt: new Date(),
        deletionRejectedBy: session.user.id
      });

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
