// src/lib/services/user/tokens.ts
// This module is dedicated to handling verification and password reset tokens.
import { getAdminCollection, COLLECTIONS } from "@/lib/firebase/admin";
import type { Timestamp } from "firebase-admin/firestore";
import { logger } from "@/lib/logger";

export async function storeVerificationToken(email: string, token: string, expiresAt: Date): Promise<void> {
  try {
    const verificationTokensCollection = getAdminCollection(COLLECTIONS.VERIFICATION_TOKENS);
    await verificationTokensCollection.doc(token).set({ email, expiresAt });
  } catch (error) {
    logger.error("UserService: storeVerificationToken error:", error);
    throw new Error("Failed to store verification token");
  }
}

export async function storePasswordResetToken(email: string, token: string, expiresAt: Date): Promise<void> {
  try {
    const passwordResetTokensCollection = getAdminCollection(COLLECTIONS.PASSWORD_RESET_TOKENS);
    await passwordResetTokensCollection.doc(token).set({ email, expiresAt });
  } catch (error) {
    logger.error("UserService: storePasswordResetToken error:", error);
    throw new Error("Failed to store password reset token");
  }
}

export async function verifyAndConsumeToken(
  token: string,
  type: "verification" | "password_reset"
): Promise<string | null> {
  try {
    const collectionName =
      type === "verification" ? COLLECTIONS.VERIFICATION_TOKENS : COLLECTIONS.PASSWORD_RESET_TOKENS;
    const collection = getAdminCollection(collectionName);

    const tokenDocRef = collection.doc(token);
    const doc = await tokenDocRef.get();
    if (!doc.exists) return null;

    const data = doc.data() as { expiresAt: Timestamp; email: string };
    const expired = data.expiresAt.toDate() < new Date();
    await tokenDocRef.delete();

    if (expired) return null;
    return data.email;
  } catch (error) {
    logger.error("UserService: verifyAndConsumeToken error:", error);
    return null;
  }
}

export async function verifyTokenWithoutConsuming(
  token: string,
  type: "verification" | "password_reset"
): Promise<string | null> {
  try {
    const collectionName =
      type === "verification" ? COLLECTIONS.VERIFICATION_TOKENS : COLLECTIONS.PASSWORD_RESET_TOKENS;
    const collection = getAdminCollection(collectionName);

    const tokenDocRef = collection.doc(token);
    const doc = await tokenDocRef.get();
    if (!doc.exists) return null;

    const data = doc.data() as { expiresAt: Timestamp; email: string };
    const expired = data.expiresAt.toDate() < new Date();
    if (expired) {
      await tokenDocRef.delete();
      return null;
    }
    return data.email;
  } catch (error) {
    logger.error("UserService: verifyTokenWithoutConsuming error:", error);
    return null;
  }
}
