import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import type { ServiceResponse } from "@/types/service-response";

export const adminAccountsService = {
  /**
   * Creates a minimal "accounts" doc used by NextAuth FirestoreAdapter conventions.
   * This is mainly for compatibility / parity with your old sync logic.
   */
  async createGoogleAccountLink(input: {
    userId: string;
    providerAccountId: string;
  }): Promise<ServiceResponse<{ id: string }>> {
    try {
      const db = getAdminFirestore();

      const docRef = await db.collection("accounts").add({
        userId: input.userId,
        type: "oauth",
        provider: "google",
        providerAccountId: input.providerAccountId,

        // Optional placeholders (kept for parity with older logic)
        access_token: "placeholder",
        token_type: "bearer",
        scope: "email profile",
        id_token: "placeholder",

        createdAt: new Date(),
        updatedAt: new Date()
      });

      return { success: true, data: { id: docRef.id } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error creating provider account link";
      return { success: false, error: message, status: 500 };
    }
  }
};
