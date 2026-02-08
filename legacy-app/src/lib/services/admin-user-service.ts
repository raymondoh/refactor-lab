// src/lib/services/admin-user-service.ts
"use server";

import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { getUserImage } from "@/utils/get-user-image";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

import type { User, UserRole } from "@/types/user";
import type { SerializedUser } from "@/types/models/user";
import type { ServiceResponse } from "@/lib/services/types/service-response";

import { adminDataPrivacyService } from "@/lib/services/admin-data-privacy-service";
import { adminAuthService } from "@/lib/services/admin-auth-service";
import { userRepo } from "@/lib/repos/user-repo";

type UserLookupDoc = Partial<Pick<User, "email" | "name" | "displayName" | "role">> & {
  image?: string;
  picture?: string;
  photoURL?: string;
  profileImage?: string;
};

export const adminUserService = {
  /**
   * List users with pagination.
   * NOTE: Admin gating must happen in actions.
   */
  async listUsers(limit = 20, offset = 0): Promise<ServiceResponse<{ users: SerializedUser[]; total: number }>> {
    return userRepo.listUsers(limit, offset);
  },

  /**
   * Fetch a single user by id – serialized shape for UI
   * NOTE: Admin gating must happen in actions.
   */
  async getUserById(userId: string): Promise<ServiceResponse<{ user: SerializedUser }>> {
    return userRepo.getUserById(userId);
  },

  /**
   * Lightweight lookup map for UI tables/logs
   * Returns a map keyed by userId with minimal identity fields.
   * NOTE: Admin gating must happen in actions.
   */
  async getUsersLookup(): Promise<
    ServiceResponse<{
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

      return { success: true, data: { usersById } };
    } catch (error: unknown) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error building users lookup";
      return { success: false, error: message, status: 500 };
    }
  },

  /**
   * Patch a user document.
   * Intended for small updates like flags, status, role adjustments, etc.
   * NOTE: Admin gating must happen in actions.
   */
  async patchUser(userId: string, patch: Record<string, unknown>): Promise<ServiceResponse<{ id: string }>> {
    if (!userId) return { success: false, error: "User ID is required", status: 400 };

    try {
      const db = getAdminFirestore();

      const updateData: Record<string, unknown> = {
        ...patch,
        updatedAt: new Date()
      };

      Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

      await db.collection("users").doc(userId).set(updateData, { merge: true });

      return { success: true, data: { id: userId } };
    } catch (error: unknown) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error patching user";
      return { success: false, error: message, status: 500 };
    }
  },

  /**
   * Back-compat alias for older code paths.
   */
  async updateUser(userId: string, userData: Record<string, unknown>): Promise<ServiceResponse<{ id: string }>> {
    return this.patchUser(userId, userData);
  },

  /**
   * Delete ONLY the Firestore user document.
   * NOTE: Admin gating must happen in actions.
   */
  async deleteUserDoc(userId: string): Promise<ServiceResponse<{ id: string }>> {
    if (!userId) return { success: false, error: "User ID is required", status: 400 };

    try {
      const db = getAdminFirestore();
      await db.collection("users").doc(userId).delete();
      return { success: true, data: { id: userId } };
    } catch (error: unknown) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error deleting user doc";
      return { success: false, error: message, status: 500 };
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
  async deleteUserFully(userId: string): Promise<ServiceResponse<{ id: string }>> {
    if (!userId) return { success: false, error: "User ID is required", status: 400 };

    try {
      // 1) Best-effort: delete likes + referenced profile image
      try {
        await adminDataPrivacyService.deleteUserLikesAndProfileImage(userId);
      } catch {}

      // 2) Best-effort: delete known storage folder if your app uses one
      try {
        await adminDataPrivacyService.deleteUserStorageFolder(`users/${userId}/`);
      } catch {}

      // 3) Delete Auth user (most important)
      const authRes = await adminAuthService.deleteUserAuthAndDoc(userId);
      if (!authRes.success) {
        return {
          success: false,
          error: authRes.error || "Failed to delete Firebase Auth user",
          status: authRes.status ?? 500
        };
      }

      // 4) Best-effort: ensure firestore doc is gone
      try {
        await this.deleteUserDoc(userId);
      } catch {}

      return { success: true, data: { id: userId } };
    } catch (error: unknown) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error deleting user";
      return { success: false, error: message, status: 500 };
    }
  },

  /**
   * Minimal stats for admin dashboard (counts only).
   * NOTE: Admin gating must happen in actions.
   */
  async getAdminUserStats(): Promise<ServiceResponse<{ totalUsers: number; totalAdmins: number }>> {
    try {
      const db = getAdminFirestore();

      const totalSnap = await db.collection("users").count().get();
      const totalUsers = totalSnap.data().count;

      const adminSnap = await db.collection("users").where("role", "==", "admin").count().get();
      const totalAdmins = adminSnap.data().count;

      return { success: true, data: { totalUsers, totalAdmins } };
    } catch (error: unknown) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error fetching admin user stats";
      return { success: false, error: message, status: 500 };
    }
  }
};
