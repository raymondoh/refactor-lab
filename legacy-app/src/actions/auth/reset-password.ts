//src/actions/auth/reset-password.ts
"use server";

import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { serverTimestamp } from "@/utils/date-server";
import { logActivity } from "@/firebase/actions";
import { firebaseError, isFirebaseError } from "@/utils/firebase-error";
import { logServerEvent, logger } from "@/utils/logger";
import { hashPassword } from "@/utils/hashPassword";

// import type {
//   LogPasswordResetInput,
//   ResetPasswordResponse,
//   GetUserIdByEmailInput,
//   GetUserIdByEmailResponse,
//   UpdatePasswordHashInput
// } from "@/types/auth/password";
import type { Auth } from "@/types";
import type { Common } from "@/types";

/**
 * Logs a password reset activity
 */
export async function logPasswordResetActivity({
  email
}: Auth.LogPasswordResetInput): Promise<Auth.ResetPasswordState> {
  if (!email) {
    logger({ type: "warn", message: "logPasswordResetActivity called with no email", context: "auth" });
    return { success: false, error: "Email is required" };
  }

  try {
    const userRecord = await getAdminAuth().getUserByEmail(email);

    if (userRecord) {
      await logActivity({
        userId: userRecord.uid,
        type: "password_reset_requested",
        description: "Password reset email sent",
        status: "success",
        metadata: { email }
      });

      logger({ type: "info", message: `Logged password reset request for ${email}`, context: "auth" });

      await logServerEvent({
        type: "auth:password_reset_requested",
        message: `Password reset requested for ${email}`,
        userId: userRecord.uid,
        context: "auth"
      });
    }

    return { success: true };
  } catch (error: unknown) {
    if (isFirebaseError(error) && error.code !== "auth/user-not-found") {
      logger({
        type: "error",
        message: "Error logging password reset activity",
        metadata: { error },
        context: "auth"
      });
    }

    return { success: true }; // Silent fail if user not found
  }
}

/**
 * Gets a user ID by email
 */
export async function getUserIdByEmail({ email }: Auth.GetUserIdByEmailInput): Promise<Auth.GetUserIdByEmailResponse> {
  if (!email) {
    logger({ type: "warn", message: "getUserIdByEmail called with no email", context: "auth" });
    return { success: false, error: "Email is required" };
  }

  try {
    const userRecord = await getAdminAuth().getUserByEmail(email);

    logger({ type: "info", message: `Found UID for ${email}`, metadata: { uid: userRecord.uid }, context: "auth" });

    return { success: true, userId: userRecord.uid };
  } catch (error: unknown) {
    logger({
      type: "error",
      message: `Error getting UID for ${email}`,
      metadata: { error },
      context: "auth"
    });

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "auth/user-not-found"
    ) {
      return { success: false, error: "User not found" };
    }

    if (isFirebaseError(error)) {
      return { success: false, error: firebaseError(error) };
    }

    return { success: false, error: "Failed to get user ID" };
  }
}

/**
 * Updates password hash in Firestore
 */
export async function updatePasswordHash({
  userId,
  newPassword
}: Auth.UpdatePasswordHashInput): Promise<Common.ActionResponse> {
  if (!userId || !newPassword) {
    logger({ type: "warn", message: "updatePasswordHash called with missing userId or password", context: "auth" });
    return { success: false, error: "User ID and new password are required" };
  }

  try {
    const passwordHash = await hashPassword(newPassword);

    await getAdminFirestore().collection("users").doc(userId).update({
      passwordHash,
      updatedAt: serverTimestamp()
    });

    await logActivity({
      userId,
      type: "password_reset_completed",
      description: "Password reset completed",
      status: "success"
    });

    logger({ type: "info", message: `Updated password hash for UID: ${userId}`, context: "auth" });

    await logServerEvent({
      type: "auth:password_reset_completed",
      message: `Password reset completed for ${userId}`,
      userId,
      context: "auth"
    });

    return { success: true };
  } catch (error: unknown) {
    logger({
      type: "error",
      message: `Error updating password hash for UID: ${userId}`,
      metadata: { error },
      context: "auth"
    });

    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error";

    return { success: false, error: message };
  }
}
