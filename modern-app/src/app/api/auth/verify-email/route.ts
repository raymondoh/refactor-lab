// src/app/api/auth/verify-email/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { tokenService } from "@/lib/auth/tokens";
import { userService } from "@/lib/services/user-service";
import { emailService } from "@/lib/email/email-service";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const tokenSchema = z.object({
  token: z.string().min(1, "Token is required")
});

// Narrow local view of what tokenService returns, instead of `any`
type EmailVerificationTokenResult = {
  valid: boolean;
  email?: string | null;
  reason?: string | null;
  error?: string | null;
};

// Mask token for logs to avoid leaking secrets
function maskToken(token: string): string {
  if (token.length <= 12) return token;
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = tokenSchema.parse(body);

    const masked = maskToken(token);
    logger.info("[auth/verify-email] Incoming verify request", { token: masked });

    const tokenResult = (await tokenService.verifyAndConsumeEmailVerificationToken(
      token
    )) as EmailVerificationTokenResult;

    logger.info("[auth/verify-email] tokenResult", {
      valid: tokenResult?.valid,
      reason: tokenResult?.reason,
      error: tokenResult?.error,
      emailPresent: !!tokenResult?.email,
      token: masked
    });

    if (!tokenResult?.valid || !tokenResult?.email) {
      const reason: string | null = tokenResult?.reason ?? null;
      const rawError: string | undefined = tokenResult?.error ?? undefined;

      // 🔸 Graceful handling for "already used / expired" generic case
      // Matches cases like: { valid: false, error: "Invalid or expired token" }
      if (!reason && rawError === "Invalid or expired token") {
        return NextResponse.json(
          {
            success: true,
            message:
              "This verification link is no longer active. If you’ve already verified your email, you can sign in now."
          },
          {
            status: 200,
            headers: NO_STORE_HEADERS
          }
        );
      }

      const errorMessage =
        reason === "expired"
          ? "Verification token has expired."
          : reason === "consumed"
            ? "This verification link has already been used."
            : "Invalid verification token.";

      return NextResponse.json(
        { error: errorMessage, reason },
        {
          status: 400,
          headers: NO_STORE_HEADERS
        }
      );
    }

    // Mark user as verified
    const emailVerified = await userService.verifyUserEmail(tokenResult.email);
    if (!emailVerified) {
      logger.error("[auth/verify-email] Failed to mark user as verified", {
        email: tokenResult.email
      });
      return NextResponse.json({ error: "Failed to verify email" }, { status: 500, headers: NO_STORE_HEADERS });
    }

    const user = await userService.getUserByEmail(tokenResult.email);

    if (user && user.email) {
      try {
        if (user.role === "tradesperson") {
          await emailService.sendTradespersonWelcomeEmail(user.email, user.name || "");
        } else if (user.role === "customer") {
          await emailService.sendCustomerWelcomeEmail(user.email, user.name || "");
        }
      } catch (welcomeErr) {
        // Don't fail verification if welcome email fails
        logger.error("[auth/verify-email] Failed to send welcome email", {
          email: user.email,
          role: user.role,
          error: welcomeErr
        });
      }
    }

    const redirectPath =
      user && !user.onboardingComplete
        ? user.role === "tradesperson"
          ? "/onboarding/tradesperson"
          : "/onboarding/customer"
        : "/dashboard";

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully",
        role: user?.role,
        redirectPath
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    logger.error("[auth/verify-email] Email verification error", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid token" },
        {
          status: 400,
          headers: NO_STORE_HEADERS
        }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: NO_STORE_HEADERS
      }
    );
  }
}
