// src/lib/repos/user-repo.ts

import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { getUserImage } from "@/utils/get-user-image";
import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import { serializeUser } from "@/utils/serializeUser";

// FIXED: Changed from "@/types/user/common" to "@/types/models/user"
import type { SerializedUser } from "@/types/models/user";
import type { ServiceResponse } from "@/lib/services/types/service-response";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

function isoOrValue(value: unknown) {
  return value instanceof Timestamp ? value.toDate().toISOString() : value;
}

function mapDocToSerializedUser(doc: DocumentSnapshot): SerializedUser {
  const data = (doc.data() ?? {}) as Record<string, unknown>;

  const rawUser = {
    id: doc.id,
    ...data,
    image: getUserImage(data),
    createdAt: isoOrValue(data.createdAt) as string, // Cast to string
    updatedAt: isoOrValue(data.updatedAt) as string,
    lastLoginAt: isoOrValue(data.lastLoginAt) as string,
    emailVerified: Boolean(data.emailVerified)
  };

  return serializeUser(rawUser);
}

export const userRepo = {
  async getUserById(userId: string): Promise<ServiceResponse<{ user: SerializedUser }>> {
    if (!userId) return { success: false, error: "User ID is required", status: 400 };

    try {
      const db = getAdminFirestore();
      const snap = await db.collection("users").doc(userId).get();

      if (!snap.exists) return { success: false, error: "User not found", status: 404 };

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

  async listUsers(limit = 20, offset = 0): Promise<ServiceResponse<{ users: SerializedUser[]; total: number }>> {
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(200, Math.floor(limit))) : 20;
    const safeOffset = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;

    try {
      const db = getAdminFirestore();

      const usersSnap = await db.collection("users").limit(safeLimit).offset(safeOffset).get();
      const totalSnap = await db.collection("users").count().get();
      const total = totalSnap.data().count;

      const users = usersSnap.docs.map(mapDocToSerializedUser);
      return { success: true, data: { users, total } };
    } catch (error: unknown) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error fetching users";
      return { success: false, error: message, status: 500 };
    }
  }
};
