// src/lib/services/admin-user-service.ts

import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { getUserImage } from "@/utils/get-user-image";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

import type { User, UserRole } from "@/types/user";
// FIXED: Changed from "@/types/user/common" to "@/types/models/user"
import type { SerializedUser } from "@/types/models/user";
import type { ServiceResponse } from "@/lib/services/types/service-response";

import { userRepo } from "@/lib/repos/user-repo";
/**
 * Admin gate – ensures the caller is authenticated AND an admin
 */
async function requireAdmin(): Promise<ServiceResponse<{ userId: string }>> {
  const { auth } = await import("@/auth");
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated", status: 401 };
  }

  try {
    const db = getAdminFirestore();
    const adminDoc = await db.collection("users").doc(session.user.id).get();
    const adminData = adminDoc.data() as Partial<User> | undefined;

    if (!adminData || adminData.role !== "admin") {
      return { success: false, error: "Unauthorized. Admin access required.", status: 403 };
    }

    return { success: true, data: { userId: session.user.id } };
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error checking admin access";
    return { success: false, error: message, status: 500 };
  }
}

export const adminUserService = {
  /**
   * List users with pagination (admin only)
   */
  async listUsers(limit = 20, offset = 0): Promise<ServiceResponse<{ users: SerializedUser[]; total: number }>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    return userRepo.listUsers(limit, offset);
  },

  /**
   * Fetch a single user by id (admin only) – serialized shape for UI
   */
  async getUserById(userId: string): Promise<ServiceResponse<{ user: SerializedUser }>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    return userRepo.getUserById(userId);
  },

  /**
   * Lightweight lookup map for UI tables/logs
   * Returns a map keyed by userId with minimal identity fields.
   */
  async getUsersLookup(): Promise<
    ServiceResponse<{
      usersById: Record<string, { id: string; email?: string; displayName?: string; image?: string; role?: UserRole }>;
    }>
  > {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    try {
      const db = getAdminFirestore();
      const snap = await db.collection("users").get();

      const usersById: Record<
        string,
        { id: string; email?: string; displayName?: string; image?: string; role?: UserRole }
      > = {};

      for (const doc of snap.docs) {
        const data = doc.data() as any;
        usersById[doc.id] = {
          id: doc.id,
          email: data.email,
          displayName: data.displayName || data.name,
          image: getUserImage(data) || undefined,
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
   * Patch a user document (admin only).
   * Intended for small updates like flags, status, role adjustments, etc.
   */
  async patchUser(userId: string, patch: Record<string, unknown>): Promise<ServiceResponse<{ id: string }>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

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
   * If your actions/pages call updateUser(userId, userData) keep it working via patchUser.
   */
  async updateUser(userId: string, userData: Record<string, unknown>): Promise<ServiceResponse<{ id: string }>> {
    return this.patchUser(userId, userData);
  },
  /**
   * Delete ONLY the Firestore user document (admin only).
   */
  async deleteUserDoc(userId: string): Promise<ServiceResponse<{ id: string }>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

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
   * Delete Firebase Auth account + Firestore user doc (admin only).
   * Note: best-effort cleanup (if auth delete fails, we return the failure and do not delete doc).
   */
  async deleteUserAccount(userId: string): Promise<ServiceResponse<{ id: string }>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    if (!userId) return { success: false, error: "User ID is required", status: 400 };

    try {
      const { adminAuthService } = await import("@/lib/services/admin-auth-service");

      // delete auth user
      const delRes = await adminAuthService.deleteUserAuthAndDoc(userId);
      if (!delRes.success) {
        return { success: false, error: delRes.error || "Failed to delete auth user", status: delRes.status ?? 500 };
      }

      // delete firestore doc (best effort)
      await adminUserService.deleteUserDoc(userId);

      return { success: true, data: { id: userId } };
    } catch (error: unknown) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error deleting user account";
      return { success: false, error: message, status: 500 };
    }
  },

  /**
   * Minimal stats for admin dashboard (admin only).
   * Keep this small + cheap: counts only.
   */
  async getAdminUserStats(): Promise<
    ServiceResponse<{
      totalUsers: number;
      totalAdmins: number;
    }>
  > {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

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
