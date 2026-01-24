// ===============================
// 📂 src/actions/auth/resend-verification.ts
// ===============================

"use server";

import { getAdminAuth } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logActivity } from "@/firebase/actions";
import { z } from "zod";

// Schema for email verification request
const emailVerificationRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

// Resend email verification
export async function resendEmailVerification(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const validatedFields = emailVerificationRequestSchema.safeParse({ email });

    if (!validatedFields.success) {
      return { success: false, error: "Please enter a valid email address" };
    }

    const auth = getAdminAuth();
    const verificationLink = await auth.generateEmailVerificationLink(email);

    // In a real app, you would send this link via email
    console.log("Email verification link:", verificationLink);

    // Get user by email for logging
    const userRecord = await auth.getUserByEmail(email).catch(() => null);

    if (userRecord) {
      await logActivity({
        userId: userRecord.uid,
        type: "email-verification-resend",
        description: "Email verification resent",
        status: "success"
      });
    }

    return { success: true, message: "Verification email sent successfully" };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error resending verification email";
    console.error("Error resending verification email:", message);
    return { success: false, error: message };
  }
}
