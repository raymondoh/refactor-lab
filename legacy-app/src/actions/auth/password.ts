// src/actions/auth/password.ts
"use server";

import { adminAuthService } from "@/lib/services/admin-auth-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logActivity } from "@/firebase/actions";
import { z } from "zod";

const updatePasswordSchema = z
  .object({
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters")
  })
  .refine(d => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

export async function updatePassword(_prevState: unknown, formData: FormData) {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    const validated = updatePasswordSchema.safeParse({
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword")
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message ?? "Invalid form data" };
    }

    const res = await adminAuthService.updateAuthUser(session.user.id, { password: validated.data.newPassword });
    if (!res.ok) return { success: false, error: res.error };

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
    return { success: false, error: message };
  }
}
