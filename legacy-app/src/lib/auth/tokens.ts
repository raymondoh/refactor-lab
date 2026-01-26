import crypto from "node:crypto";
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { serverTimestamp } from "@/utils/date-server";

type VerifyResult = { valid: true; email: string } | { valid: false; reason?: "expired" | "consumed"; error?: string };

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function randomToken(bytes = 32): string {
  // URL-safe-ish token (hex). Good enough for email links.
  return crypto.randomBytes(bytes).toString("hex");
}

export const tokenService = {
  async createEmailVerificationToken(email: string): Promise<string> {
    const db = getAdminFirestore();

    const token = randomToken(32);
    const tokenHash = sha256(token);

    // 60 minutes expiry (match modern if you know its TTL; can adjust later)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.collection("emailVerificationTokens").add({
      tokenHash,
      email: email.trim().toLowerCase(),
      createdAt: serverTimestamp(),
      expiresAt,
      consumedAt: null
    });

    return token;
  },

  async verifyAndConsumeEmailVerificationToken(token: string): Promise<VerifyResult> {
    const db = getAdminFirestore();
    const tokenHash = sha256(token);

    const snap = await db.collection("emailVerificationTokens").where("tokenHash", "==", tokenHash).limit(1).get();

    if (snap.empty) {
      return { valid: false, error: "Invalid or expired token" };
    }

    const doc = snap.docs[0]!;
    const data = doc.data() as any;

    const email = typeof data.email === "string" ? data.email : null;
    const expiresAt: Date | null =
      data.expiresAt?.toDate?.() ?? (data.expiresAt instanceof Date ? data.expiresAt : null);
    const consumedAt: Date | null = data.consumedAt?.toDate?.() ?? null;

    if (!email) return { valid: false, error: "Invalid or expired token" };

    if (consumedAt) return { valid: false, reason: "consumed" };

    if (expiresAt && expiresAt.getTime() < Date.now()) {
      return { valid: false, reason: "expired" };
    }

    await doc.ref.update({ consumedAt: serverTimestamp() });

    return { valid: true, email };
  }
};
