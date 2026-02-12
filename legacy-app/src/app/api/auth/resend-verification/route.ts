// legacy-app/src/app/api/auth/resend-verification/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { adminAuthService } from "@/lib/services/admin-auth-service";
import { tokenService } from "@/lib/auth/tokens";

const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
  recaptchaToken: z.string().optional() // accepted for compatibility; ignored for now
});

type OkResponse = { ok: true; message: string };
type ErrorResponse = { ok: false; error: string };

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

function buildVerifyLink(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => ({}) as unknown);
    const parsed = resendVerificationSchema.safeParse(rawBody);

    if (!parsed.success) {
      const issue = parsed.error.issues?.[0];
      return NextResponse.json<ErrorResponse>(
        { ok: false, error: issue?.message ?? "Invalid request data" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();

    // ✅ No user enumeration: default success response
    const generic: OkResponse = {
      ok: true,
      message: "If an account exists for that email, we've sent a verification link."
    };

    // ✅ Service-driven: find user UID
    const userRes = await adminAuthService.getUserByEmail(email);

    // If user not found -> generic success (but allow dev token)
    if (!userRes.success) {
      if (process.env.NODE_ENV === "development") {
        try {
          const token = await tokenService.createEmailVerificationToken(email);
          const link = buildVerifyLink(token);
          console.log("[DEV resend-verification] Verification link:", link);
        } catch (e) {
          console.error("[DEV resend-verification] Failed to create token", e);
        }
      }

      return NextResponse.json(generic, { headers: NO_STORE_HEADERS });
    }

    const userId = userRes.data.uid;

    // ✅ Check emailVerified via service
    const authUserRes = await adminAuthService.getAuthUserById(userId);
    const emailVerified = authUserRes.success ? !!authUserRes.data.emailVerified : false;

    if (emailVerified) {
      if (process.env.NODE_ENV === "development") {
        try {
          const token = await tokenService.createEmailVerificationToken(email);
          const link = buildVerifyLink(token);
          console.log("[DEV resend-verification] Verification link:", link);
        } catch (e) {
          console.error("[DEV resend-verification] Failed to create token", e);
        }
      }

      return NextResponse.json(generic, { headers: NO_STORE_HEADERS });
    }

    // Create token and "send" email (log link for now)
    try {
      const token = await tokenService.createEmailVerificationToken(email);
      const link = buildVerifyLink(token);
      console.log("[resend-verification] Verification link:", link);
    } catch (e) {
      // Don’t leak details; still return generic success
      console.error("[resend-verification] Failed to create/send verification token", e);
    }

    return NextResponse.json<OkResponse>(generic, { headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to resolve order.";

    console.error("Resend verification error:", msg);

    return NextResponse.json<ErrorResponse>(
      { ok: false, error: "Failed to resend verification email" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
