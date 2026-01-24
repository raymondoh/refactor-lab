import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { userService } from "@/lib/services/user-service";
import { tokenService } from "@/lib/auth/tokens";
import { emailService } from "@/lib/email/email-service";
import { passwordResetRateLimiter, rateLimitKeys } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";
import { verifyRecaptcha, RECAPTCHA_ACTIONS } from "@/lib/recaptcha-service";

const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
  recaptchaToken: z.string().optional()
});

type OkResponse = { ok: true; message: string };
type ErrorResponse = { ok: false; error: string };

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

// 🔐 Use centralised action constant
const RECAPTCHA_ACTION = RECAPTCHA_ACTIONS.RESEND_VERIFICATION;

function getClientIp(request: NextRequest) {
  const xff = request.headers.get("x-forwarded-for");
  return xff ? xff.split(",")[0].trim() : "127.0.0.1";
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    // ✅ 1) Parse body first (need email for ip+email rate limiting)
    const rawBody = await request.json().catch(() => ({}) as unknown); // handle empty/invalid JSON gracefully

    const parsed = resendVerificationSchema.safeParse(rawBody);
    if (!parsed.success) {
      const issue = parsed.error.issues?.[0];
      return NextResponse.json<ErrorResponse>(
        { ok: false, error: issue?.message ?? "Invalid request data" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const recaptchaToken = parsed.data.recaptchaToken ?? null;

    // ✅ 2) Rate limiting by (IP + email)
    // Reuse password-reset limiter for resend-verification (same abuse profile)
    try {
      const key = rateLimitKeys.ipEmail(ip, email);
      const { success } = await passwordResetRateLimiter.limit(key);

      if (!success) {
        logger.warn("[auth/resend-verification] Rate limit exceeded", { ip, email });
        return NextResponse.json<ErrorResponse>(
          { ok: false, error: "Too many attempts. Please wait a moment and try again." },
          { status: 429, headers: NO_STORE_HEADERS }
        );
      }
    } catch (rateError: unknown) {
      logger.error("[auth/resend-verification] Rate limiter unexpected error (failing closed)", rateError);
      return NextResponse.json<ErrorResponse>(
        {
          ok: false,
          error: "Verification requests are temporarily unavailable. Please try again shortly."
        },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    // ✅ 3) reCAPTCHA v3 verification
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, RECAPTCHA_ACTION);

    if (!recaptchaResult.ok) {
      logger.warn("[auth/resend-verification] reCAPTCHA failed", {
        email,
        reason: recaptchaResult.reason,
        score: recaptchaResult.raw?.score,
        action: recaptchaResult.raw?.action,
        expectedAction: recaptchaResult.expectedAction,
        token: recaptchaResult.token
      });

      return NextResponse.json<ErrorResponse>(
        {
          ok: false,
          error: "Verification request blocked. Please try again later."
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    logger.info("[auth/resend-verification] reCAPTCHA passed", {
      email,
      score: recaptchaResult.raw?.score,
      action: recaptchaResult.raw?.action,
      expectedAction: recaptchaResult.expectedAction,
      token: recaptchaResult.token
    });

    // ✅ 4) Normal resend-verification flow (no user enumeration)
    const user = await userService.getUserByEmail(email).catch((err: unknown) => {
      logger.error("[auth/resend-verification] userService.getUserByEmail failed", { email, error: err });
      return null;
    });

    // If no user OR already verified → respond generically.
    if (!user || user.emailVerified) {
      logger.info("[auth/resend-verification] No user or already verified; returning generic response", { email });

      return NextResponse.json<OkResponse>(
        { ok: true, message: "If an account exists for that email, we've sent a verification link." },
        { headers: NO_STORE_HEADERS }
      );
    }

    // ✅ 5) Create and send a fresh verification token.
    // Any failure here is logged but DOES NOT change the outward response (no enumeration).
    try {
      const token = await tokenService.createEmailVerificationToken(email);
      const sent = await emailService.sendVerificationEmail(email, token, user.name || undefined);

      if (!sent) {
        logger.error("[auth/resend-verification] Email service returned false", { email });
      } else {
        logger.info("[auth/resend-verification] Verification email sent", { email });
      }
    } catch (emailError: unknown) {
      logger.error("[auth/resend-verification] Failed to send verification email", { email, error: emailError });
      // Still return generic success below
    }

    // ✅ 6) Generic success response (no user enumeration)
    return NextResponse.json<OkResponse>(
      { ok: true, message: "If an account exists for that email, we've sent a verification link." },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    logger.error("[auth/resend-verification] Resend verification error", err);

    // Internal errors: return 500 (doesn't leak account existence).
    return NextResponse.json<ErrorResponse>(
      { ok: false, error: "Failed to resend verification email" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
