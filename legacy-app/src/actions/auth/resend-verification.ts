"use server";

import { adminAuthService } from "@/lib/services/admin-auth-service";
import { ok, fail } from "@/lib/services/service-result";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logServerEvent } from "@/lib/services/logging-service";

// Example: Resend (adjust if using another provider)
import { resend } from "@/lib/email/resend"; // your configured resend instance

export async function resendVerificationAction(email: string) {
  if (!email) {
    return fail("VALIDATION", "Email address is required.");
  }

  try {
    // 1) Generate Firebase verification link
    const result = await adminAuthService.generateEmailVerificationLink(email);

    if (!result.success || !result.data?.link) {
      const code = result.status === 404 ? "NOT_FOUND" : "UNKNOWN";

      return fail(code, result.error || "Could not generate verification link.");
    }

    const verificationLink = result.data.link;

    // 2) Send email using Resend
    await resend.emails.send({
      from: "MotoStix <no-reply@motostix.com>",
      to: email,
      subject: "Verify your email address",
      html: `
        <p>Welcome to MotoStix.</p>

        <p>Please verify your email by clicking the link below:</p>

        <p>
          <a href="${verificationLink}">
            Verify your email
          </a>
        </p>

        <p>This link will expire automatically.</p>
      `
    });

    // 3) Log event
    await logServerEvent({
      type: "auth:resend-verification",
      message: `Verification email resent: ${email}`,
      context: "auth"
    });

    return ok({
      success: true,
      message: "Verification email sent successfully."
    });
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unexpected error";

    return fail("UNKNOWN", message);
  }
}

export { resendVerificationAction as resendVerification };
