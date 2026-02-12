// ===============================
// 📂 src/actions/auth/resend-verification.ts
// ===============================

"use server";

import { adminAuthService } from "@/lib/services/admin-auth-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logActivity } from "@/firebase/actions";
import { z } from "zod";

// Schema for email verification request
const emailVerificationRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

// Resend email verification
export async function resendVerification(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const validatedFields = emailVerificationRequestSchema.safeParse({ email });

    if (!validatedFields.success) {
      return { success: false, error: "Please enter a valid email address" };
    }

    // 1) Generate verification link (service-driven)
    // NOTE: add generateEmailVerificationLink to adminAuthService (see below)
    const linkRes = await adminAuthService.generateEmailVerificationLink(email);
    if (!linkRes.success) {
      return { success: false, error: linkRes.error };
    }

    const verificationLink = linkRes.data.link;

    // In a real app, you would send this link via email
    console.log("Email verification link:", verificationLink);

    // 2) Fetch user for logging (service-driven)
    const userRes = await adminAuthService.getUserByEmail(email);
    if (userRes.success) {
      await logActivity({
        userId: userRes.data.uid,
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
