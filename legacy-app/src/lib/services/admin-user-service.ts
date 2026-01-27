// src/lib/services/admin-user-service.ts

import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { getUserImage } from "@/utils/get-user-image";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { Timestamp } from "firebase-admin/firestore";
import { serializeUser } from "@/utils/serializeUser";

import type { User } from "@/types/user";
import type { SerializedUser } from "@/types/user/common";
import type { UserRole } from "@/types/user";

/**
 * Standard service response shape
 */
type ServiceResponse<T> = { success: true; data: T } | { success: false; error: string; status?: number };

/**
 * Admin gate – ensures the caller is authenticated AND an admin
 */
async function requireAdmin(): Promise<ServiceResponse<{ userId: string }>> {
  const { auth } = await import("@/auth");
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated", status: 401 };
  }

  const db = getAdminFirestore();
  const adminDoc = await db.collection("users").doc(session.user.id).get();
  const adminData = adminDoc.data() as Partial<User> | undefined;

  if (!adminData || adminData.role !== "admin") {
    return {
      success: false,
      error: "Unauthorized. Admin access required.",
      status: 403
    };
  }

  return { success: true, data: { userId: session.user.id } };
}

/**
 * Normalize Firestore timestamps
 */
function isoOrValue(value: unknown) {
  return value instanceof Timestamp ? value.toDate().toISOString() : value;
}

/**
 * Convert a Firestore user doc to SerializedUser (stable shape for UI)
 */
function mapDocToSerializedUser(doc: FirebaseFirestore.DocumentSnapshot): SerializedUser {
  const data = (doc.data() ?? {}) as any;

  const rawUser = {
    id: doc.id,
    ...data,
    image: getUserImage(data),
    createdAt: isoOrValue(data.createdAt),
    updatedAt: isoOrValue(data.updatedAt),
    lastLoginAt: isoOrValue(data.lastLoginAt),
    emailVerified: Boolean(data.emailVerified)
  };

  return serializeUser(rawUser);
}

/**
 * Admin User Service
 * All admin-only Firestore access for users lives here
 */
export const adminUserService = {
  /**
   * List users with pagination (admin only)
   */
  async listUsers(limit = 20, offset = 0): Promise<ServiceResponse<{ users: SerializedUser[]; total: number }>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    try {
      const db = getAdminFirestore();

      const usersSnap = await db.collection("users").limit(limit).offset(offset).get();

      const totalSnap = await db.collection("users").count().get();
      const total = totalSnap.data().count;

      const users = usersSnap.docs.map(mapDocToSerializedUser);

      return {
        success: true,
        data: { users, total }
      };
    } catch (error: unknown) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error fetching users";

      return { success: false, error: message, status: 500 };
    }
  },

  /**
   * Fetch a single user by id (admin only)
   * Matches actions/admin.ts: result.data.user
   */
  async getUserById(userId: string): Promise<ServiceResponse<{ user: SerializedUser }>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    if (!userId) return { success: false, error: "User ID is required", status: 400 };

    try {
      const db = getAdminFirestore();
      const snap = await db.collection("users").doc(userId).get();

      if (!snap.exists) {
        return { success: false, error: "User not found", status: 404 };
      }

      const user = mapDocToSerializedUser(snap);
      return { success: true, data: { user } };
    } catch (error: unknown) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error fetching user";

      return { success: false, error: message, status: 500 };
    }
  },

  /**
   * Update user fields (admin only)
   * Matches actions/admin.ts: updateUser(userId, userData)
   */
  async updateUser(
    userId: string,
    userData: { name?: string; role?: UserRole }
  ): Promise<ServiceResponse<{ id: string }>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    if (!userId) return { success: false, error: "User ID is required", status: 400 };

    try {
      const db = getAdminFirestore();
      const ref = db.collection("users").doc(userId);

      const snap = await ref.get();
      if (!snap.exists) return { success: false, error: "User not found", status: 404 };

      // Allowlist fields only, remove undefined
      const update: Record<string, unknown> = {
        ...(userData.name !== undefined ? { name: userData.name } : {}),
        ...(userData.role !== undefined ? { role: userData.role } : {}),
        updatedAt: new Date()
      };

      await ref.update(update);

      return { success: true, data: { id: userId } };
    } catch (error: unknown) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error updating user";

      return { success: false, error: message, status: 500 };
    }
  },

  /**
   * Delete Firestore user doc only (admin only)
   * Matches actions/admin.ts: deleteUserDoc(userId)
   */
  async deleteUserDoc(userId: string): Promise<ServiceResponse<{}>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    if (!userId) return { success: false, error: "User ID is required", status: 400 };

    try {
      const db = getAdminFirestore();
      const ref = db.collection("users").doc(userId);

      const snap = await ref.get();
      if (!snap.exists) return { success: false, error: "User not found", status: 404 };

      await ref.delete();
      return { success: true, data: {} };
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
   * Delete user account (admin only): Firebase Auth user + Firestore doc
   * Matches actions/admin.ts: deleteUserAccount(userId)
   */
  async deleteUserAccount(userId: string): Promise<ServiceResponse<{}>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    if (!userId) return { success: false, error: "User ID is required", status: 400 };

    try {
      const db = getAdminFirestore();
      const userRef = db.collection("users").doc(userId);

      // Best effort: doc may or may not exist.
      const docSnap = await userRef.get();

      // Delete Auth user
      const { getAdminAuth } = await import("@/lib/firebase/admin/initialize");
      const adminAuth = getAdminAuth();

      // If the Auth user doesn't exist, Firebase throws — treat that as non-fatal and continue doc deletion.
      await adminAuth.deleteUser(userId).catch(err => {
        // If it's a Firebase error, surface it; otherwise keep going only if doc exists
        // (safer to fail loud rather than silently ignoring real issues)
        throw err;
      });

      // Delete Firestore doc if present
      if (docSnap.exists) {
        await userRef.delete();
      }

      return { success: true, data: {} };
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
   * Admin dashboard stats for users (counts)
   */
  async getAdminUserStats(): Promise<
    ServiceResponse<{ totalUsers: number; activeUsers7d: number; newUsersToday: number }>
  > {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    try {
      const db = getAdminFirestore();

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);

      const totalSnap = await db.collection("users").count().get();
      const totalUsers = totalSnap.data().count;

      const activeSnap = await db.collection("users").where("lastLoginAt", ">=", sevenDaysAgo).count().get();
      const activeUsers7d = activeSnap.data().count;

      const newSnap = await db.collection("users").where("createdAt", ">=", today).count().get();
      const newUsersToday = newSnap.data().count;

      return { success: true, data: { totalUsers, activeUsers7d, newUsersToday } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error fetching user stats";

      return { success: false, error: message, status: 500 };
    }
  },
  /**
   * Lightweight lookup map for userId -> basic fields
   * Used for enriching activity logs / admin UIs.
   */
  async getUsersLookup(): Promise<ServiceResponse<Record<string, { name?: string; email?: string; image?: string }>>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    try {
      const db = getAdminFirestore();
      const snap = await db.collection("users").get();

      const lookup: Record<string, { name?: string; email?: string; image?: string }> = {};

      snap.docs.forEach(doc => {
        const data = doc.data() as any;
        lookup[doc.id] = {
          name: data?.name ?? data?.displayName ?? undefined,
          email: data?.email ?? undefined,
          image: getUserImage(data) ?? undefined
        };
      });

      return { success: true, data: lookup };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error building users lookup";

      return { success: false, error: message, status: 500 };
    }
  }
};
