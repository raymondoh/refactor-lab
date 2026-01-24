// src/firebase/client/auth.ts

"use client";

import { auth } from "@/firebase/client/firebase-client-init";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import {
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  ActionCodeSettings
} from "firebase/auth";

/**
 * Shared settings for Firebase Auth email actions (verify/reset)
 */
const actionCodeSettings: ActionCodeSettings = {
  url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth-action`,
  handleCodeInApp: false
};

/**
 * Returns the action settings used when sending a verification email.
 */
export function getVerificationSettings(): ActionCodeSettings {
  return { ...actionCodeSettings };
}

/**
 * Returns the action settings used when sending a password reset email.
 */
export function getPasswordResetSettings(): ActionCodeSettings {
  return { ...actionCodeSettings };
}

/**
 * Sends a verification email to the currently authenticated Firebase user.
 */
export const sendVerificationEmail = async (
  user: { id: string; email: string; emailVerified: boolean } | null
): Promise<void> => {
  if (!user) {
    return Promise.reject("No user provided");
  }

  if (!auth.currentUser) {
    return Promise.reject("No authenticated Firebase user");
  }

  try {
    const settings = getVerificationSettings();
    const urlWithUid = auth.currentUser.uid ? `${settings.url}?uid=${auth.currentUser.uid}` : settings.url;

    await sendEmailVerification(auth.currentUser, { ...settings, url: urlWithUid });
    console.log("Verification email sent.");
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Failed to send verification email";

    console.error("Verification email error:", message);
    return Promise.reject(message);
  }
};

/**
 * Sends a password reset email to the given address.
 */
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email, getPasswordResetSettings());
    return { success: true };
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "An unknown error occurred while sending reset email";

    console.error("Password reset email error:", message);
    return { success: false, error: message };
  }
}

/**
 * Verifies that the provided password reset code is valid.
 */
export async function verifyResetCode(
  code: string
): Promise<{ success: boolean; email?: string | null; error?: string }> {
  try {
    const email = await verifyPasswordResetCode(auth, code);
    return { success: true, email };
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Error verifying reset code";

    console.error("Verify reset code error:", message);
    return { success: false, error: message };
  }
}

/**
 * Completes a password reset using the code and new password.
 */
export async function completePasswordReset(
  code: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await confirmPasswordReset(auth, code, newPassword);
    return { success: true };
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Error confirming password reset";

    console.error("Complete password reset error:", message);
    return { success: false, error: message };
  }
}

/**
 * Checks if the given user’s email is verified.
 */
export const isEmailVerified = (user: { emailVerified: boolean } | null): boolean => {
  return user?.emailVerified ?? false;
};

/**
 * Forces a refresh of the currently signed-in Firebase user's profile.
 */
export const refreshUserStatus = async (user: { reload: () => Promise<void> } | null): Promise<void> => {
  if (!user) return Promise.reject("No user provided");

  try {
    await user.reload();
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Error refreshing user";

    console.error("Refresh user status error:", message);
    return Promise.reject(message);
  }
};
