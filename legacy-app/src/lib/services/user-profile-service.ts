// src/lib/services/user-profile-service.ts
import "server-only";

import { getAdminFirestore, getAdminAuth } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { Timestamp } from "firebase-admin/firestore";
import { serializeUser } from "@/utils/serializeUser";
import { getUserImage } from "@/utils/get-user-image";

import type { User } from "@/types/user";
import type { SerializedUser } from "@/types/models/user";
import { ok, fail, type ServiceResult } from "@/lib/services/service-result";

// ✅ typed helper
function dateish(value: unknown): string | Timestamp | Date | undefined {
  if (value instanceof Timestamp) return value;
  if (value instanceof Date) return value;
  if (typeof value === "string") return value;
  return undefined;
}

function errMessage(error: unknown, fallback: string) {
  return isFirebaseError(error) ? firebaseError(error) : error instanceof Error ? error.message : fallback;
}

export const userProfileService = {
  async getProfileByUserId(userId: string): Promise<ServiceResult<{ user: SerializedUser }>> {
    try {
      if (!userId) return fail("BAD_REQUEST", "User ID is required", 400);

      const db = getAdminFirestore();
      const doc = await db.collection("users").doc(userId).get();

      if (!doc.exists) return fail("NOT_FOUND", "User not found", 404);

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

      return ok({ user: serializeUser(rawUser) });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error fetching profile"), 500);
    }
  },

  async updateProfileByUserId(userId: string, updateData: Record<string, unknown>): Promise<ServiceResult<{}>> {
    try {
      if (!userId) return fail("BAD_REQUEST", "User ID is required", 400);

      const db = getAdminFirestore();
      await db
        .collection("users")
        .doc(userId)
        .update({ ...updateData, updatedAt: new Date() });

      return ok({});
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error updating profile"), 500);
    }
  },

  /**
   * Update Firebase Auth profile for a given userId
   */
  async updateAuthProfileByUserId(
    userId: string,
    authUpdate: Parameters<ReturnType<typeof getAdminAuth>["updateUser"]>[1]
  ): Promise<ServiceResult<{}>> {
    try {
      if (!userId) return fail("BAD_REQUEST", "User ID is required", 400);

      const adminAuth = getAdminAuth();
      await adminAuth.updateUser(userId, authUpdate);

      return ok({});
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error updating auth profile"), 500);
    }
  }
};
