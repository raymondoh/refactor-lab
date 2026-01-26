import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin/initialize";
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
  // Modern verify endpoint expects POST { token }, but your UI likely has a page that consumes token.
  // If you already have /verify-email page, use it here. Otherwise, keep it simple:
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

    // Find user in Firebase Auth (if not found => generic success)
    const auth = getAdminAuth();
    const userRecord = await auth.getUserByEmail(email).catch(() => null);

    if (!userRecord || userRecord.emailVerified) {
      // ✅ Dev-only: allow testing the token flow even if already verified or user missing
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

    // Optional: ensure Firestore user exists / has name
    const db = getAdminFirestore();
    const userDoc = await db.collection("users").doc(userRecord.uid).get();
    const userData = userDoc.exists ? (userDoc.data() as any) : null;

    // Create token and "send" email
    // Phase 2: if you don't have an email service, log the link.
    try {
      const token = await tokenService.createEmailVerificationToken(email);
      const link = buildVerifyLink(token);

      // TODO (Phase 3): replace console.log with real email service (Resend)
      console.log("[resend-verification] Verification link:", link);

      // If you already have a logger util and want it:
      // logger({ type: "info", message: "Verification link created", context: "auth", metadata: { email } });
    } catch (e) {
      // Don’t leak details; still return generic success
      console.error("[resend-verification] Failed to create/send verification token", e);
    }

    return NextResponse.json<OkResponse>(generic, { headers: NO_STORE_HEADERS });
  } catch (err: unknown) {
    return NextResponse.json<ErrorResponse>(
      { ok: false, error: "Failed to resend verification email" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
