import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { userService } from "@/lib/services/user-service";
import { tokenService } from "@/lib/auth/tokens";
import { emailService } from "@/lib/email/email-service";
import { passwordResetRateLimiter, rateLimitKeys } from "@/lib/rate-limiter";

import { logger } from "@/lib/logger";
import { verifyRecaptcha, RECAPTCHA_ACTIONS } from "@/lib/recaptcha-service";

const RECAPTCHA_ACTION = RECAPTCHA_ACTIONS.FORGOT_PASSWORD;
const RECAPTCHA_MIN_SCORE = 0.5;

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  recaptchaToken: z.string().optional()
});

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

function getClientIp(request: NextRequest) {
  const xff = request.headers.get("x-forwarded-for");
  return xff ? xff.split(",")[0].trim() : "127.0.0.1";
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    // ✅ 1) Parse body FIRST so we have email for ip+email rate limiting
    const rawBody = await request.json().catch(() => ({}) as unknown);

    const parsed = forgotPasswordSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues?.[0]?.message ?? "Invalid request data" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const recaptchaToken = parsed.data.recaptchaToken ?? null;

    // ✅ 2) Rate limiting by (IP + email)
    try {
      const key = rateLimitKeys.ipEmail(ip, email);
      const { success } = await passwordResetRateLimiter.limit(key);

      if (!success) {
        logger.warn("[auth/forgot-password] Rate limit exceeded", { ip, email });
        return NextResponse.json(
          { error: "Too many password reset attempts. Please try again later." },
          { status: 429, headers: NO_STORE_HEADERS }
        );
      }
    } catch (rateError: unknown) {
      logger.error("[auth/forgot-password] Rate limiter unexpected error (failing closed)", rateError);
      return NextResponse.json(
        { error: "Password reset is temporarily unavailable. Please try again shortly." },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    // ✅ 3) reCAPTCHA v3 verification
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, RECAPTCHA_ACTION);

    if (!recaptchaResult.ok || (recaptchaResult.score ?? 0) < RECAPTCHA_MIN_SCORE) {
      logger.warn("[auth/forgot-password] reCAPTCHA failed", {
        email,
        reason: recaptchaResult.reason,
        score: recaptchaResult.raw?.score,
        action: recaptchaResult.raw?.action,
        expectedAction: recaptchaResult.expectedAction,
        token: recaptchaResult.token
      });

      // Generic error, still no user enumeration
      return NextResponse.json(
        { error: "Password reset blocked. Please try again later." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    logger.info("[auth/forgot-password] reCAPTCHA passed", {
      email,
      score: recaptchaResult.raw?.score,
      action: recaptchaResult.raw?.action,
      expectedAction: recaptchaResult.expectedAction
    });

    // ✅ 4) Normal forgot-password flow (still no user enumeration)
    logger.info("[auth/forgot-password] Password reset requested", { email });
    const user = await userService.getUserByEmail(email);

    if (user) {
      const token = await tokenService.createPasswordResetToken(email);
      await emailService.sendPasswordResetEmail(email, token, user.name || undefined);
      logger.info("[auth/forgot-password] Password reset email sent", { email });
    } else {
      logger.info("[auth/forgot-password] Unknown email received; returning generic response", { email });
    }

    return NextResponse.json(
      {
        success: true,
        message: "If an account with that email exists, we have sent a password reset link."
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    logger.error("[auth/forgot-password] Password reset request error", err);

    // Generic success to avoid leaking account existence
    return NextResponse.json(
      {
        success: true,
        message: "If an account with that email exists, we have sent a password reset link."
      },
      { headers: NO_STORE_HEADERS }
    );
  }
}
