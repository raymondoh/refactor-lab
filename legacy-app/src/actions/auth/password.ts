"use server";

import { getAdminAuth } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logActivity } from "@/firebase/log/logActivity";
import { z } from "zod";

// Schema for password reset request
const passwordResetSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

// Request password reset

// Schema for password update
const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password must be at least 6 characters"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters")
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });

// Update password for logged-in user
export async function updatePassword(prevState: any, formData: FormData) {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    const validatedFields = updatePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword
    });

    if (!validatedFields.success) {
      const errorMessage = validatedFields.error.issues[0]?.message || "Invalid form data";
      return { success: false, error: errorMessage };
    }

    const adminAuth = getAdminAuth();

    // Update password in Firebase Auth
    await adminAuth.updateUser(session.user.id, {
      password: newPassword
    });

    await logActivity({
      userId: session.user.id,
      type: "password-change",
      description: "Password changed successfully",
      status: "success"
    });

    return { success: true, message: "Password updated successfully" };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error updating password";
    console.error("Error updating password:", message);
    return { success: false, error: message };
  }
}

// Legacy function for backward compatibility
