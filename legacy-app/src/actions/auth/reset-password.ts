// src/actions/auth/reset-password.ts
"use server";

import { adminAuthService } from "@/lib/services/admin-auth-service";
import { serverTimestamp } from "@/utils/date-server";
import { logActivity } from "@/firebase/actions";
import { firebaseError, isFirebaseError } from "@/utils/firebase-error";
import { hashPassword } from "@/utils/hashPassword";
import { logger, logServerEvent } from "@/utils/logger";
import type { Auth, Common } from "@/types";

export async function logPasswordResetActivity({
  email
}: Auth.LogPasswordResetInput): Promise<Auth.ResetPasswordState> {
  if (!email) return { success: false, error: "Email is required" };

  try {
    const res = await adminAuthService.getUserByEmail(email);
    if (res.ok) {
      await logActivity({
        userId: res.data.uid,
        type: "password_reset_requested",
        description: "Password reset email sent",
        status: "success",
        metadata: { email }
      });

      await logServerEvent({
        type: "auth:password_reset_requested",
        message: `Password reset requested for ${email}`,
        userId: res.data.uid,
        context: "auth"
      });
    }
    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function getUserIdByEmail({ email }: Auth.GetUserIdByEmailInput): Promise<Auth.GetUserIdByEmailResponse> {
  if (!email) return { success: false, error: "Email is required" };

  const res = await adminAuthService.getUserByEmail(email);
  if (!res.ok) return { success: false, error: res.error };

  return { success: true, userId: res.data.uid };
}

export async function updatePasswordHash({
  userId,
  newPassword
}: Auth.UpdatePasswordHashInput): Promise<Common.ActionResponse> {
  if (!userId || !newPassword) return { success: false, error: "User ID and new password are required" };

  try {
    const passwordHash = await hashPassword(newPassword);

    // Uses adminAuthService.updateUserDoc for Firestore updates
    const updateRes = await adminAuthService.updateUserDoc(userId, {
      passwordHash,
      updatedAt: serverTimestamp()
    });

    if (!updateRes.ok) return { success: false, error: updateRes.error };

    await logActivity({
      userId,
      type: "password_reset_completed",
      description: "Password reset completed",
      status: "success"
    });

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
