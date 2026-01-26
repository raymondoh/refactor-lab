import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { tokenService } from "@/lib/auth/tokens";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin/initialize";
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

function maskToken(token: string): string {
  if (token.length <= 12) return token;
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = tokenSchema.parse(body);

    const masked = maskToken(token);

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

    // Mark Firebase Auth emailVerified + sync Firestore
    const auth = getAdminAuth();
    const userRecord = await auth.getUserByEmail(email);

    if (!userRecord.emailVerified) {
      await auth.updateUser(userRecord.uid, { emailVerified: true });
    }

    await updateEmailVerificationStatus({ userId: userRecord.uid, verified: true });

    // Load user doc to match modern’s redirect logic
    const db = getAdminFirestore();
    const userDoc = await db.collection("users").doc(userRecord.uid).get();
    const user = userDoc.exists ? (userDoc.data() as any) : null;

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
