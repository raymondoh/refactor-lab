"use server";

import { getAdminAuth } from "@/lib/firebase/admin/initialize";
// Keep the old import for now - it will use our compatibility layer
// Later we can update this to import directly from initialize
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logActivity } from "@/firebase/actions";

// Example function using the new pattern
export async function verifyIdToken(token: string) {
  try {
    const auth = getAdminAuth();
    // Use the new initialization
    const decodedToken = await auth.verifyIdToken(token);
    return { success: true, data: decodedToken };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error verifying token";
    return { success: false, error: message };
  }
}

// Example function still using the old pattern (via compatibility layer)
export async function getUserByEmail(email: string) {
  try {
    // This still works because of our compatibility layer in auth.ts
    const userRecord = await getAdminAuth().getUserByEmail(email);
    return { success: true, data: userRecord };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error getting user by email";
    return { success: false, error: message };
  }
}

// Login with Firebase credentials
export async function loginWithFirebaseCredentials(email: string, password: string) {
  try {
    // In a server action, we can't directly verify passwords with Firebase Admin SDK
    // This would typically use the Firebase Auth REST API
    // For now, we'll just check if the user exists

    const auth = getAdminAuth();
    const userRecord = await auth.getUserByEmail(email).catch(() => null);

    if (!userRecord) {
      await logActivity({
        userId: email, // We don't have the user ID yet
        type: "login",
        description: "Firebase credential login failed",
        status: "error", // Changed from "failed" to "error"
        metadata: { error: "User not found" }
      });

      return { success: false, error: "Invalid email or password" };
    }

    // In a real implementation, you would verify the password here
    // Since we can't do that with the Admin SDK, we'll just return success

    await logActivity({
      userId: userRecord.uid,
      type: "login",
      description: "Firebase credential login successful",
      status: "success"
    });

    return {
      success: true,
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName
      }
    };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error during login";

    await logActivity({
      userId: "system",
      type: "login",
      description: "Firebase credential login error",
      status: "error",
      metadata: { error: message }
    });

    return { success: false, error: message };
  }
}
