// src/app/api/auth/verify-email/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { tokenService } from "@/lib/auth/tokens";
import { adminAuthService } from "@/lib/services/admin-auth-service";
import { updateEmailVerificationStatus } from "@/actions/auth/email-verification";

export const dynamic = "force-dynamic";
const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

// Combined schema to handle both verification protocols
const verifySchema = z.object({
  token: z.string().optional(),
  oobCode: z.string().optional(),
  mode: z.string().optional()
});

type EmailVerificationTokenResult = {
  valid: boolean;
  email?: string | null;
  reason?: string | null;
  error?: string | null;
};

function roleToRedirectPath(role: unknown) {
  return role === "admin" ? "/admin" : "/user";
}

export async function POST(request: NextRequest) {
  try {
    // Read body once to avoid "Body is unusable" error
    const body = await request.json();
    console.log("DEBUG: Received verification request:", body);

    const { token, oobCode } = verifySchema.parse(body);

    let userId: string | null = null;
    let userEmail: string | null = null;
    let userRole: unknown = "user";

    // --- FLOW A: Custom App Token Flow ---
    if (token) {
      const tokenResult = (await tokenService.verifyAndConsumeEmailVerificationToken(
        token
      )) as unknown as EmailVerificationTokenResult;

      if (!tokenResult?.valid || !tokenResult?.email) {
        const reason = tokenResult?.reason ?? null;
        const rawError = tokenResult?.error ?? undefined;

        // Graceful handling for already-verified or expired tokens
        if (!reason && rawError === "Invalid or expired token") {
          return NextResponse.json(
            {
              success: true,
              message: "This link is no longer active. You may already be verified.",
              // Best effort default for clients expecting a redirectPath
              redirectPath: "/user"
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

      userEmail = tokenResult.email;

      // Pull role + uid from your canonical user lookup
      const userRes = await adminAuthService.getUserByEmail(userEmail);
      if (!userRes.ok || !userRes.data) {
        return NextResponse.json({ error: "User not found." }, { status: 404, headers: NO_STORE_HEADERS });
      }

      userId = userRes.data.uid;
      userRole = (userRes.data as any)?.role ?? "user";
    }

    // --- FLOW B: Firebase OOB Code Flow ---
    else if (oobCode) {
      const checkRes = await adminAuthService.checkActionCode(oobCode);

      if (!checkRes.ok) {
        return NextResponse.json(
          { error: checkRes.error },
          { status: checkRes.status ?? 400, headers: NO_STORE_HEADERS }
        );
      }

      // checkActionCode returns both uid and email
      userId = checkRes.data.uid;
      userEmail = checkRes.data.email;

      // Fetch role (and normalize uid/email if needed) so we can return the correct redirectPath
      if (userEmail) {
        const userRes = await adminAuthService.getUserByEmail(userEmail);
        if (userRes.ok && userRes.data) {
          userRole = (userRes.data as any)?.role ?? "user";
          // Keep the uid from Auth action code as the source of truth, but fall back if missing
          if (!userId) userId = userRes.data.uid;
        }
      }
    } else {
      return NextResponse.json({ error: "No token or code provided." }, { status: 400, headers: NO_STORE_HEADERS });
    }

    // --- FINALIZATION: Sync Auth State & Firestore ---
    if (!userId) {
      return NextResponse.json({ error: "Could not identify user." }, { status: 400, headers: NO_STORE_HEADERS });
    }

    // 1. Mark as verified in Firebase Auth (standardizes the bit across both flows)
    const verifyRes = await adminAuthService.markEmailVerified(userId);
    if (!verifyRes.ok) {
      return NextResponse.json({ error: verifyRes.error }, { status: 500, headers: NO_STORE_HEADERS });
    }

    // 2. Sync with Firestore and log activity
    await updateEmailVerificationStatus({ userId, verified: true });

    const redirectPath = roleToRedirectPath(userRole);

    console.log(`DEBUG: Successfully verified user: ${userEmail} → redirect ${redirectPath}`);

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully",
        // ✅ route group is invisible, so return real URLs
        redirectPath
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    console.error("Internal Route Error:", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid request format" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
