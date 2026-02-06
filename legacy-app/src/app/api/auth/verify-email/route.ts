// legacy-app/src/app/api/auth/verify-email/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { tokenService } from "@/lib/auth/tokens";
import { adminAuthService } from "@/lib/services/admin-auth-service";
import { updateEmailVerificationStatus } from "@/actions/auth/email-verification";

export const dynamic = "force-dynamic";
const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const tokenSchema = z.object({
  token: z.string().min(1, "Token is required")
});

type EmailVerificationTokenResult = {
  valid: boolean;
  email?: string | null;
  reason?: string | null;
  error?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = tokenSchema.parse(body);

    const tokenResult = (await tokenService.verifyAndConsumeEmailVerificationToken(
      token
    )) as unknown as EmailVerificationTokenResult;

    // Mirror modern’s graceful handling
    if (!tokenResult?.valid || !tokenResult?.email) {
      const reason: string | null = tokenResult?.reason ?? null;
      const rawError: string | undefined = tokenResult?.error ?? undefined;

      if (!reason && rawError === "Invalid or expired token") {
        return NextResponse.json(
          {
            success: true,
            message:
              "This verification link is no longer active. If you’ve already verified your email, you can sign in now."
          },
          { status: 200, headers: NO_STORE_HEADERS }
        );
      }

      const errorMessage =
        reason === "expired"
          ? "Verification token has expired."
          : reason === "consumed"
            ? "This verification link has already been used."
            : "Invalid verification token.";

      return NextResponse.json({ error: errorMessage, reason }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const email = tokenResult.email;

    // ✅ Service-driven user lookup
    const userRes = await adminAuthService.getUserByEmail(email);
    if (!userRes.success) {
      return NextResponse.json({ error: "Invalid verification token." }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const userId = userRes.data.uid;

    // ✅ Mark Auth + Firestore emailVerified (service-driven)
    const verifyRes = await adminAuthService.markEmailVerified(userId);
    if (!verifyRes.success) {
      return NextResponse.json({ error: verifyRes.error }, { status: 500, headers: NO_STORE_HEADERS });
    }

    // ✅ Keep your existing logging/updates (now service-driven internally)
    await updateEmailVerificationStatus({ userId, verified: true });

    const redirectPath = "/dashboard";

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully",
        redirectPath
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid token" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
