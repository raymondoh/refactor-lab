// src/app/api/auth/reset-password/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { tokenService } from "@/lib/auth/tokens";
import { userService } from "@/lib/services/user-service";
import { logger } from "@/lib/logger";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // Verify and consume the token
    const email = await tokenService.consumePasswordResetToken(token);

    if (!email) {
      logger.warn("[auth/reset-password] Invalid or expired reset token");
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400, headers: NO_STORE_HEADERS });
    }

    logger.info("[auth/reset-password] Reset token consumed, updating password", { email });

    // Use the userService to update the password
    const success = await userService.updateUserPassword(email, password);

    if (!success) {
      logger.error("[auth/reset-password] Failed to update password in userService", { email });
      return NextResponse.json({ error: "Failed to update password" }, { status: 500, headers: NO_STORE_HEADERS });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successfully"
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    logger.error("[auth/reset-password] Password reset error", err);

    if (err instanceof z.ZodError) {
      const issue = err.issues?.[0] || (err as { errors?: { message?: string }[] }).errors?.[0];

      return NextResponse.json(
        { error: issue?.message ?? "Invalid request data" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json({ error: "Password reset failed" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
