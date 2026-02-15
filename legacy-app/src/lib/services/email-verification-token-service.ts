// src/lib/services/email-verification-token-service.ts
import crypto from "node:crypto";
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { serverTimestamp } from "@/utils/date-server";
import { ok, fail, type ServiceResult } from "@/lib/services/service-result";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

export type VerifyResult =
  | { valid: true; email: string }
  | { valid: false; reason?: "expired" | "consumed"; error?: string };

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function randomToken(bytes = 32): string {
  // URL-safe-ish token (hex). Good enough for email links.
  return crypto.randomBytes(bytes).toString("hex");
}

export const emailVerificationTokenService = {
  async createEmailVerificationToken(email: string): Promise<ServiceResult<{ token: string }>> {
    try {
      const db = getAdminFirestore();

      const token = randomToken(32);
      const tokenHash = sha256(token);

      // 60 minutes expiry
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db.collection("emailVerificationTokens").add({
        tokenHash,
        email: email.trim().toLowerCase(),
        createdAt: serverTimestamp(),
        expiresAt,
        consumedAt: null
      });

      return ok({ token });
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error creating email verification token";
      return fail("UNKNOWN", message, 500);
    }
  },

  async verifyAndConsumeEmailVerificationToken(token: string): Promise<ServiceResult<VerifyResult>> {
    try {
      const db = getAdminFirestore();
      const tokenHash = sha256(token);

      const snap = await db.collection("emailVerificationTokens").where("tokenHash", "==", tokenHash).limit(1).get();

      if (snap.empty) {
        return ok({ valid: false, error: "Invalid or expired token" });
      }

      const doc = snap.docs[0]!;
      const data = doc.data() as unknown as Record<string, unknown>;

      const email = typeof data.email === "string" ? data.email : null;

      const expiresAt: Date | null =
        (data.expiresAt as any)?.toDate?.() ?? (data.expiresAt instanceof Date ? data.expiresAt : null);

      const consumedAt: Date | null = (data.consumedAt as any)?.toDate?.() ?? null;

      if (!email) return ok({ valid: false, error: "Invalid or expired token" });

      if (consumedAt) return ok({ valid: false, reason: "consumed" });

      if (expiresAt && expiresAt.getTime() < Date.now()) {
        return ok({ valid: false, reason: "expired" });
      }

      await doc.ref.update({ consumedAt: serverTimestamp() });

      return ok({ valid: true, email });
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error verifying token";
      return fail("UNKNOWN", message, 500);
    }
  }
};
