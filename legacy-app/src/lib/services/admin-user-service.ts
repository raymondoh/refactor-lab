// src/lib/services/admin-user-service.ts

import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { getUserImage } from "@/utils/get-user-image";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

import type { User, UserRole } from "@/types/user";
import type { SerializedUser } from "@/types/models/user";
import type { ServiceResult } from "@/lib/services/service-result";
import { ok, fail } from "@/lib/services/service-result";

import { adminDataPrivacyService } from "@/lib/services/admin-data-privacy-service";
import { adminAuthService } from "@/lib/services/admin-auth-service";
import { userRepo } from "@/lib/repos/user-repo";

type UserLookupDoc = Partial<Pick<User, "email" | "name" | "displayName" | "role">> & {
  image?: string;
  picture?: string;
  photoURL?: string;
  profileImage?: string;
};

function errMessage(error: unknown, fallback: string) {
  return isFirebaseError(error) ? firebaseError(error) : error instanceof Error ? error.message : fallback;
}

export const adminUserService = {
  /**
   * List users with pagination.
   * NOTE: Admin gating must happen in actions.
   */
  async listUsers(limit = 20, offset = 0): Promise<ServiceResult<{ users: SerializedUser[]; total: number }>> {
    return userRepo.listUsers(limit, offset);
  },

  /**
   * Fetch a single user by id – serialized shape for UI
   * NOTE: Admin gating must happen in actions.
   */
  async getUserById(userId: string): Promise<ServiceResult<{ user: SerializedUser }>> {
    return userRepo.getUserById(userId);
  },

  /**
   * Lightweight lookup map for UI tables/logs
   * Returns a map keyed by userId with minimal identity fields.
   * NOTE: Admin gating must happen in actions.
   */
  async getUsersLookup(): Promise<
    ServiceResult<{
      usersById: Record<string, { id: string; email?: string; displayName?: string; image?: string; role?: UserRole }>;
    }>
  > {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection("users").get();

      const usersById: Record<
        string,
        { id: string; email?: string; displayName?: string; image?: string; role?: UserRole }
      > = {};

      for (const doc of snap.docs) {
        const data = doc.data() as UserLookupDoc;

        usersById[doc.id] = {
          id: doc.id,
          email: data.email ?? undefined,
          displayName: (data.displayName || data.name) ?? undefined,
          image: getUserImage(data) ?? undefined,
          role: data.role
        };
      }

      return ok({ usersById });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error building users lookup"), 500);
    }
  },

  /**
   * Patch a user document.
   * Intended for small updates like flags, status, role adjustments, etc.
   * NOTE: Admin gating must happen in actions.
   */
  async patchUser(userId: string, patch: Record<string, unknown>): Promise<ServiceResult<{ id: string }>> {
    if (!userId) return fail("VALIDATION", "User ID is required", 400);

    try {
      const db = getAdminFirestore();

      const updateData: Record<string, unknown> = {
        ...patch,
        updatedAt: new Date()
      };

      Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

      await db.collection("users").doc(userId).set(updateData, { merge: true });

      return ok({ id: userId });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error patching user"), 500);
    }
  },

  /**
   * Back-compat alias for older code paths.
   */
  async updateUser(userId: string, userData: Record<string, unknown>): Promise<ServiceResult<{ id: string }>> {
    return this.patchUser(userId, userData);
  },

  /**
   * Delete ONLY the Firestore user document.
   * NOTE: Admin gating must happen in actions.
   */
  async deleteUserDoc(userId: string): Promise<ServiceResult<{ id: string }>> {
    if (!userId) return fail("VALIDATION", "User ID is required", 400);

    try {
      const db = getAdminFirestore();
      await db.collection("users").doc(userId).delete();
      return ok({ id: userId });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error deleting user doc"), 500);
    }
  },

  /**
   * Delete user everywhere
   * - deletes likes + profile image (best-effort)
   * - deletes storage folder (best-effort)
   * - deletes firestore doc (best-effort)
   * - deletes auth user (source of truth)
   * NOTE: Admin gating must happen in actions.
   */
  async deleteUserFully(userId: string): Promise<ServiceResult<{ id: string }>> {
    if (!userId) return fail("VALIDATION", "User ID is required", 400);

    try {
      // 1) Best-effort: delete likes + referenced profile image
      try {
        const res = await adminDataPrivacyService.deleteUserLikesAndProfileImage(userId);
        // best-effort: ignore failures
        void res;
      } catch {}

      // 2) Best-effort: delete known storage folder if your app uses one
      try {
        const res = await adminDataPrivacyService.deleteUserStorageFolder(`users/${userId}/`);
        void res;
      } catch {}

      // 3) Delete Auth user (most important)
      const authRes = await adminAuthService.deleteUserAuthAndDoc(userId);
      if (!authRes.ok) {
        return fail(
          authRes.code ?? "UNKNOWN",
          authRes.error || "Failed to delete Firebase Auth user",
          authRes.status ?? 500
        );
      }

      // 4) Best-effort: ensure firestore doc is gone
      try {
        await this.deleteUserDoc(userId);
      } catch {}

      return ok({ id: userId });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error deleting user"), 500);
    }
  },

  /**
   * Minimal stats for admin dashboard (counts only).
   * NOTE: Admin gating must happen in actions.
   */
  async getAdminUserStats(): Promise<ServiceResult<{ totalUsers: number; totalAdmins: number }>> {
    try {
      const db = getAdminFirestore();

      const totalSnap = await db.collection("users").count().get();
      const totalUsers = totalSnap.data().count;

      const adminSnap = await db.collection("users").where("role", "==", "admin").count().get();
      const totalAdmins = adminSnap.data().count;

      return ok({ totalUsers, totalAdmins });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error fetching admin user stats"), 500);
    }
  }
};
