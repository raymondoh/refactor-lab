"use server";

import { getAdminAuth, getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logActivity } from "@/firebase/log/logActivity";
import { revalidatePath } from "next/cache";

// Request account deletion
export async function requestAccountDeletion() {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth: userAuth } = await import("@/auth");
    const session = await userAuth();

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Log the deletion request
    await logActivity({
      userId,
      type: "account-deletion-request",
      description: "Account deletion requested",
      status: "info"
    });

    // In a real app, you might want to:
    // 1. Send a confirmation email
    // 2. Set a deletion flag in the user's document
    // 3. Schedule the actual deletion for later

    const db = getAdminFirestore();
    await db.collection("users").doc(userId).update({
      deletionRequested: true,
      deletionRequestedAt: new Date()
    });

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
