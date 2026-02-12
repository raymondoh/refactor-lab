// src/lib/services/user-service.ts
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { Timestamp } from "firebase-admin/firestore";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { getUserImage } from "@/utils/get-user-image";

import type { ServiceResponse } from "@/lib/services/types/service-response";
import type { User, UserRole } from "@/types/user";

type FirestoreUserDoc = Record<string, unknown>;

/**
 * Helpers to ensure type safety without using 'any'
 */
function asRecord(v: unknown): FirestoreUserDoc {
  return v && typeof v === "object" ? (v as FirestoreUserDoc) : {};
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asBoolean(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function toIsoIfTimestamp(v: unknown): string | undefined {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === "string") return v;
  return undefined;
}

/**
 * Maps a Firestore document to a clean User object
 */
function mapDocToUser(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): User {
  const data = asRecord(doc.data());
  const image = getUserImage(data);

  return {
    id: doc.id,
    ...(data as unknown as Omit<User, "id">),
    image,
    createdAt: toIsoIfTimestamp(data["createdAt"]) ?? "",
    updatedAt: toIsoIfTimestamp(data["updatedAt"]),
    lastLoginAt: toIsoIfTimestamp(data["lastLoginAt"]),
    emailVerified: asBoolean(data["emailVerified"], false)
  } as User;
}

export const userService = {
  /**
   * Get users with pagination (Firestore-only)
   */
  async getUsers(limit = 10, startAfter?: string): Promise<ServiceResponse<{ users: User[]; lastVisible?: string }>> {
    try {
      const db = getAdminFirestore();
      let query = db.collection("users").orderBy("createdAt", "desc").limit(limit);

      if (startAfter) {
        const lastDoc = await db.collection("users").doc(startAfter).get();
        if (lastDoc.exists) query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      const users = snapshot.docs.map(mapDocToUser);
      const lastVisible = snapshot.docs[snapshot.docs.length - 1]?.id;

      return { success: true, data: { users, lastVisible } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error occurred while fetching users";

      return { success: false, error: message, status: 500 };
    }
  },

  /**
   * Fetch a single user by their ID
   */
  async getUserById(userId: string): Promise<ServiceResponse<{ user: User }>> {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection("users").doc(userId).get();

      if (!snap.exists) return { success: false, error: "User not found", status: 404 };

      const user = mapDocToUser(snap);
      return { success: true, data: { user } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error fetching user";

      return { success: false, error: message, status: 500 };
    }
  },

  /**
   * Get user role (Firestore-only)
   */
  async getUserRole(userId: string): Promise<ServiceResponse<{ role: UserRole }>> {
    try {
      const db = getAdminFirestore();
      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) return { success: false, error: "User not found", status: 404 };

      const data = asRecord(userDoc.data());
      const role = asString(data["role"], "user") as UserRole;

      return { success: true, data: { role } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error getting user role";

      return { success: false, error: message, status: 500 };
    }
  }
};
