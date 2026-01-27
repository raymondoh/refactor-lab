// src/lib/services/user-profile-service.ts
import { getAdminFirestore, getAdminAuth } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { Timestamp } from "firebase-admin/firestore";
import { serializeUser } from "@/utils/serializeUser";
import { getUserImage } from "@/utils/get-user-image";

import type { User } from "@/types/user";
import type { SerializedUser } from "@/types/user/common";

type ServiceResponse<T> = { success: true; data: T } | { success: false; error: string; status?: number };

// ✅ typed helper (fixes "unknown" problem)
function dateish(value: unknown): string | Timestamp | Date | undefined {
  if (value instanceof Timestamp) return value;
  if (value instanceof Date) return value;
  if (typeof value === "string") return value;
  return undefined;
}

async function requireSession(): Promise<ServiceResponse<{ userId: string }>> {
  const { auth } = await import("@/auth");
  const session = await auth();

  if (!session?.user?.id) return { success: false, error: "Not authenticated", status: 401 };
  return { success: true, data: { userId: session.user.id } };
}

export const userProfileService = {
  async getMyProfile(): Promise<ServiceResponse<{ user: SerializedUser }>> {
    const gate = await requireSession();
    if (!gate.success) return gate;

    try {
      const db = getAdminFirestore();
      const doc = await db.collection("users").doc(gate.data.userId).get();

      if (!doc.exists) return { success: false, error: "User not found", status: 404 };

      const data = doc.data() as Partial<User> | undefined;

      // ✅ force correct field types for User
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

  async updateMyProfile(updateData: Record<string, unknown>): Promise<ServiceResponse<{}>> {
    const gate = await requireSession();
    if (!gate.success) return gate;

    try {
      const db = getAdminFirestore();
      await db
        .collection("users")
        .doc(gate.data.userId)
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
   * Update Firebase Auth profile for the current user
   */
  async updateMyAuthProfile(
    authUpdate: Parameters<ReturnType<typeof getAdminAuth>["updateUser"]>[1]
  ): Promise<ServiceResponse<{}>> {
    const gate = await requireSession();
    if (!gate.success) return gate;

    try {
      const adminAuth = getAdminAuth();
      await adminAuth.updateUser(gate.data.userId, authUpdate);
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
