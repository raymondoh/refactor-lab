// src/actions/auth/resend-verification.ts
"use server";

import { adminAuthService } from "@/lib/services/admin-auth-service";
import { ok, fail } from "@/lib/services/service-result";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logServerEvent } from "@/lib/services/logging-service";
import { headers } from "next/headers";
import { rateLimit, rateLimitKeys } from "@/lib/rateLimit";
import { resend } from "@/lib/email/resend";

export async function resendVerificationAction(email: string) {
  if (!email) {
    return fail("VALIDATION", "Email address is required.");
  }

  // Normalize email to prevent rate-limit bypassing with casing
  const normalizedEmail = email.trim().toLowerCase();

  // ✅ Extract IP reliably for Rate Limiting
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();

  // 1. IP + Email Rate Limit (1 request per 30s)
  const key = `auth:resend-verification:${rateLimitKeys.ipEmail(ip, normalizedEmail)}`;
  const rl = await rateLimit(key, { limit: 1, windowMs: 30_000, failOpen: false });

  if (!rl.success) {
    const resetMs = rl.reset ? new Date(rl.reset).getTime() : Date.now() + 30_000;
    const waitSeconds = Math.max(1, Math.ceil((resetMs - Date.now()) / 1000));
    return fail("RATE_LIMIT", `Please wait ${waitSeconds}s before requesting another verification email.`);
  }

  // 2. Global IP Backstop (10 requests per 10m)
  const ipKey = `auth:resend-verification:ip:${rateLimitKeys.ipOnly(ip)}`;
  const ipRl = await rateLimit(ipKey, { limit: 10, windowMs: 10 * 60_000, failOpen: false });

  if (!ipRl.success) {
    return fail("RATE_LIMIT", "Too many requests. Please try again later.");
  }

  try {
    // 3) Generate Firebase verification link using the normalized email
    const result = await adminAuthService.generateEmailVerificationLink(normalizedEmail);

    // ✅ Narrow explicitly (prevents TS error + avoids leaking account existence)
    if (!result.ok || !result.data?.link) {
      return fail("UNKNOWN", "Could not send verification email.");
    }

    if (!result.data?.link) {
      return fail("UNKNOWN", "Could not send verification email.");
    }

    const verificationLink = result.data.link;

    // 4) Send email using Resend
    await resend.emails.send({
      from: "MotoStix <no-reply@motostix.com>",
      to: normalizedEmail,
      subject: "Verify your email address",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to MotoStix</h2>
          <p>Please verify your email address to complete your registration and access all features.</p>
          <div style="margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          <p style="font-size: 12px; color: #666;">
            If you didn't request this email, you can safely ignore it. This link will expire automatically.
          </p>
        </div>
      `
    });

    // 5) Log event for audit trail
    await logServerEvent({
      type: "auth:resend-verification",
      message: `Verification email resent: ${normalizedEmail}`,
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
