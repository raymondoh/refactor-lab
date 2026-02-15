// src/lib/services/user-service.ts
import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { Timestamp } from "firebase-admin/firestore";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { getUserImage } from "@/utils/get-user-image";

import { ok, fail, type ServiceResult } from "@/lib/services/service-result";
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
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return undefined;
}

/**
 * Maps a Firestore document to a clean User object
 */
function mapDocToUser(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): User {
  const data = asRecord(doc.data());
  const image = getUserImage(data);

  // Avoid spreading unknown into User shape (keeps types + UI safer)
  return {
    id: doc.id,
    email: asString(data["email"]),
    name: typeof data["name"] === "string" ? data["name"] : undefined,
    displayName: typeof data["displayName"] === "string" ? data["displayName"] : undefined,
    role: (typeof data["role"] === "string" ? data["role"] : "user") as UserRole,
    image,
    createdAt: toIsoIfTimestamp(data["createdAt"]) ?? "",
    updatedAt: toIsoIfTimestamp(data["updatedAt"]),
    lastLoginAt: toIsoIfTimestamp(data["lastLoginAt"]),
    emailVerified: asBoolean(data["emailVerified"], false)
  } as User;
}

function errMessage(error: unknown, fallback: string) {
  return isFirebaseError(error) ? firebaseError(error) : error instanceof Error ? error.message : fallback;
}

export const userService = {
  /**
   * Get users with pagination (Firestore-only)
   */
  async getUsers(limit = 10, startAfter?: string): Promise<ServiceResult<{ users: User[]; lastVisible?: string }>> {
    try {
      const db = getAdminFirestore();
      const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(200, Math.floor(limit))) : 10;

      let query = db.collection("users").orderBy("createdAt", "desc").limit(safeLimit);

      if (startAfter) {
        const lastDoc = await db.collection("users").doc(startAfter).get();
        if (lastDoc.exists) query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      const users = snapshot.docs.map(mapDocToUser);
      const lastVisible = snapshot.docs[snapshot.docs.length - 1]?.id;

      return ok({ users, lastVisible });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error occurred while fetching users"), 500);
    }
  },

  /**
   * Fetch a single user by their ID
   */
  async getUserById(userId: string): Promise<ServiceResult<{ user: User }>> {
    if (!userId) return fail("BAD_REQUEST", "User ID is required", 400);

    try {
      const db = getAdminFirestore();
      const snap = await db.collection("users").doc(userId).get();

      if (!snap.exists) return fail("NOT_FOUND", "User not found", 404);

      const user = mapDocToUser(snap);
      return ok({ user });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error fetching user"), 500);
    }
  },

  /**
   * Get user role (Firestore-only)
   */
  async getUserRole(userId: string): Promise<ServiceResult<{ role: UserRole }>> {
    if (!userId) return fail("BAD_REQUEST", "User ID is required", 400);

    try {
      const db = getAdminFirestore();
      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) return fail("NOT_FOUND", "User not found", 404);

      const data = asRecord(userDoc.data());
      const role = (asString(data["role"], "user") as UserRole) || "user";

      return ok({ role });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error getting user role"), 500);
    }
  }
};
