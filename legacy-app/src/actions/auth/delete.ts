"use server";

import { getAdminAuth, getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logActivity } from "@/firebase/log/logActivity";

// Delete user account
export async function deleteUserAccount(userId: string) {
  try {
    const auth = getAdminAuth();
    const db = getAdminFirestore();
    const storage = getAdminStorage();

    // Log the deletion request
    await logActivity({
      userId,
      type: "account-deletion",
      description: "Account deletion requested",
      status: "info"
    });

    // Get user data for cleanup
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    // Delete user's profile image if exists
    if (userData?.picture) {
      try {
        const bucket = storage.bucket();
        const url = new URL(userData.picture);
        const fullPath = url.pathname.slice(1);
        const storagePath = fullPath.replace(`${bucket.name}/`, "");
        await bucket.file(storagePath).delete();
      } catch (imageError) {
        console.error("Error deleting profile image:", imageError);
      }
    }

    // Delete user's data from Firestore
    // 1. Delete likes
    const likesSnapshot = await db.collection("users").doc(userId).collection("likes").get();
    const likesDeletePromises = likesSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(likesDeletePromises);

    // 2. Delete user document
    await db.collection("users").doc(userId).delete();

    // 3. Delete user from Firebase Auth
    await auth.deleteUser(userId);

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

// Admin delete user function (alias for backward compatibility)
export async function deleteUserAsAdmin(userId: string) {
  return await deleteUserAccount(userId);
}
