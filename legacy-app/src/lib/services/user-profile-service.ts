// src/lib/services/user-profile-service.ts

import { getAdminFirestore, getAdminAuth } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { Timestamp } from "firebase-admin/firestore";
import { serializeUser } from "@/utils/serializeUser";
import { getUserImage } from "@/utils/get-user-image";

import type { User } from "@/types/user";
import type { SerializedUser } from "@/types/models/user";
import type { ServiceResponse } from "@/lib/services/types/service-response";

// ✅ typed helper
function dateish(value: unknown): string | Timestamp | Date | undefined {
  if (value instanceof Timestamp) return value;
  if (value instanceof Date) return value;
  if (typeof value === "string") return value;
  return undefined;
}

export const userProfileService = {
  async getProfileByUserId(userId: string): Promise<ServiceResponse<{ user: SerializedUser }>> {
    try {
      if (!userId) return { success: false, error: "User ID is required", status: 400 };

      const db = getAdminFirestore();
      const doc = await db.collection("users").doc(userId).get();

      if (!doc.exists) return { success: false, error: "User not found", status: 404 };

      const data = doc.data() as Partial<User> | undefined;

      const rawUser: User = {
        id: doc.id,
        ...(data ?? {}),
        image: getUserImage(data ?? {}) ?? undefined,
        createdAt: dateish(data?.createdAt),
        updatedAt: dateish(data?.updatedAt),
        lastLoginAt: dateish(data?.lastLoginAt),
        emailVerified: Boolean(data?.emailVerified)
      };

      return { success: true, data: { user: serializeUser(rawUser) } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error fetching profile";

      return { success: false, error: message, status: 500 };
    }
  },

  async updateProfileByUserId(
    userId: string,
    updateData: Record<string, unknown>
  ): Promise<ServiceResponse<Record<string, never>>> {
    try {
      if (!userId) return { success: false, error: "User ID is required", status: 400 };

      const db = getAdminFirestore();
      await db
        .collection("users")
        .doc(userId)
        .update({ ...updateData, updatedAt: new Date() });

      return { success: true, data: {} };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error updating profile";

      return { success: false, error: message, status: 500 };
    }
  },

  /**
   * Update Firebase Auth profile for a given userId
   */
  async updateAuthProfileByUserId(
    userId: string,
    authUpdate: Parameters<ReturnType<typeof getAdminAuth>["updateUser"]>[1]
  ): Promise<ServiceResponse<Record<string, never>>> {
    try {
      if (!userId) return { success: false, error: "User ID is required", status: 400 };

      const adminAuth = getAdminAuth();
      await adminAuth.updateUser(userId, authUpdate);

      return { success: true, data: {} };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error updating auth profile";

      return { success: false, error: message, status: 500 };
    }
  }
};
