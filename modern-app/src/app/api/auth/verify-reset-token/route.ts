// src/app/api/auth/verify-reset-token/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { tokenService } from "@/lib/auth/tokens";
import { logger } from "@/lib/logger";

const verifyTokenSchema = z.object({
  token: z.string().min(1, "Token is required")
});

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

type PasswordResetTokenResult = {
  valid: boolean;
  email?: string | null;
  error?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = verifyTokenSchema.parse(body);

    const tokenResult = (await tokenService.checkToken(token, "password_reset")) as PasswordResetTokenResult;

    if (!tokenResult.valid) {
      logger.warn("[auth/verify-reset-token] Invalid or expired reset token", {
        error: tokenResult.error ?? null
      });

      return NextResponse.json(
        { error: tokenResult.error || "Invalid or expired token" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    logger.info("[auth/verify-reset-token] Reset token valid", {
      email: tokenResult.email ?? null
    });

    return NextResponse.json(
      {
        success: true,
        message: "Token is valid",
        email: tokenResult.email
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const issue = err.issues?.[0] || (err as { errors?: { message?: string }[] }).errors?.[0];

      return NextResponse.json(
        { error: issue?.message ?? "Invalid request data" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    logger.error("[auth/verify-reset-token] Token verification error", err);

    return NextResponse.json({ error: "Token verification failed" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
