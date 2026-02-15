// src/lib/services/admin-data-privacy-service.ts
import { getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import type { ServiceResult } from "@/lib/services/service-result";
import { ok, fail } from "@/lib/services/service-result";

// --------------------
// helpers (no any)
// --------------------
function asRecord(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}
function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}
function getStringField(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
}

function errMessage(error: unknown, fallback: string) {
  return isFirebaseError(error) ? firebaseError(error) : error instanceof Error ? error.message : fallback;
}

type ExportedDoc = Record<string, unknown> & { id: string };
type ExportedUser = (Record<string, unknown> & { id: string }) | null;

type EmptyData = Record<string, never>;

export const adminDataPrivacyService = {
  async listDeletionRequests(): Promise<
    ServiceResult<{ users: Array<{ id: string; email?: string; name?: string }> }>
  > {
    try {
      const db = getAdminFirestore();
      const snapshot = await db.collection("users").where("deletionRequested", "==", true).get();

      const users = snapshot.docs.map(d => {
        const data = asRecord(d.data());
        return { id: d.id, email: getStringField(data, "email"), name: getStringField(data, "name") };
      });

      return ok({ users });
    } catch (error) {
      return fail("UNKNOWN", errMessage(error, "Unknown error listing deletion requests"), 500);
    }
  },

  async exportUserData(
    userId: string
  ): Promise<
    ServiceResult<{ user: ExportedUser; likes: ExportedDoc[]; activity: ExportedDoc[]; orders?: ExportedDoc[] }>
  > {
    if (!userId) return fail("VALIDATION", "User ID is required", 400);

    try {
      const db = getAdminFirestore();

      const userDoc = await db.collection("users").doc(userId).get();
      const user: ExportedUser = userDoc.exists ? ({ id: userDoc.id, ...(userDoc.data() ?? {}) } as ExportedDoc) : null;

      const likesSnapshot = await db.collection("users").doc(userId).collection("likes").get();
      const likes = likesSnapshot.docs.map(d => ({ id: d.id, ...(d.data() ?? {}) }) as ExportedDoc);

      const activitySnapshot = await db.collection("activity").where("userId", "==", userId).get();
      const activity = activitySnapshot.docs.map(d => ({ id: d.id, ...(d.data() ?? {}) }) as ExportedDoc);

      return ok({ user, likes, activity });
    } catch (error) {
      return fail("UNKNOWN", errMessage(error, "Unknown error exporting user data"), 500);
    }
  },

  async markDeletionRequested(userId: string): Promise<ServiceResult<EmptyData>> {
    if (!userId) return fail("VALIDATION", "User ID is required", 400);

    try {
      const db = getAdminFirestore();
      await db.collection("users").doc(userId).update({ deletionRequested: true });
      return ok({});
    } catch (error) {
      return fail("UNKNOWN", errMessage(error, "Unknown error updating deletion flag"), 500);
    }
  },

  async deleteUserStorageFolder(prefix: string): Promise<ServiceResult<{ deleted: boolean }>> {
    if (!prefix) return fail("VALIDATION", "Storage prefix is required", 400);

    // prefix example: `users/${userId}/` depending on your storage paths
    try {
      const storage = getAdminStorage().bucket();
      await storage.deleteFiles({ prefix });
      return ok({ deleted: true });
    } catch (error) {
      // storage cleanup shouldn’t block everything—caller can treat as best-effort.
      return fail("UNKNOWN", errMessage(error, "Unknown error deleting user storage"), 500);
    }
  },

  /**
   * Deletes user-owned "likes" docs and attempts to delete the profile image referenced by `users/{userId}.picture`.
   * Does NOT delete the user doc itself (leave that to adminAuthService.deleteUserAuthAndDoc).
   */
  async deleteUserLikesAndProfileImage(userId: string): Promise<ServiceResult<EmptyData>> {
    if (!userId) return fail("VALIDATION", "User ID is required", 400);

    try {
      const db = getAdminFirestore();
      const storage = getAdminStorage();

      // Get user data (for picture cleanup)
      const userRef = db.collection("users").doc(userId);
      const userSnap = await userRef.get();
      const userData = asRecord(userSnap.data());

      const picture = asString(userData["picture"]);

      // Delete user's profile image if exists (non-fatal)
      if (picture) {
        try {
          const bucket = storage.bucket();
          const url = new URL(picture);

          // Matches: https://storage.googleapis.com/<bucket>/<path>
          // We only delete when it clearly belongs to THIS bucket.
          const pathParts = url.pathname.split("/").filter(Boolean);
          const bucketName = bucket.name;

          // storage.googleapis.com/<bucket>/<path>
          let storagePath: string | null = null;
          if (url.hostname === "storage.googleapis.com") {
            if (pathParts.length >= 2 && pathParts[0] === bucketName) {
              storagePath = pathParts.slice(1).join("/");
            }
          }

          // firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>
          if (!storagePath && url.hostname === "firebasestorage.googleapis.com") {
            const m = url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
            if (m && m[1] === bucketName) storagePath = decodeURIComponent(m[2]);
          }

          if (storagePath) {
            await bucket.file(storagePath).delete({ ignoreNotFound: true });
          }
        } catch (imageError) {
          console.error("Error deleting profile image:", imageError);
        }
      }

      // Delete likes subcollection
      const likesSnapshot = await userRef.collection("likes").get();
      await Promise.all(likesSnapshot.docs.map(doc => doc.ref.delete()));

      return ok({});
    } catch (error) {
      return fail("UNKNOWN", errMessage(error, "Unknown error deleting user likes/profile image"), 500);
    }
  },

  async cancelDeletionRequested(userId: string): Promise<ServiceResult<EmptyData>> {
    if (!userId) return fail("VALIDATION", "User ID is required", 400);

    try {
      const db = getAdminFirestore();
      await db.collection("users").doc(userId).update({
        deletionRequested: false,
        deletionRequestedAt: null,
        deletionRejectedAt: null,
        deletionRejectedBy: null
      });
      return ok({});
    } catch (error) {
      return fail("UNKNOWN", errMessage(error, "Unknown error cancelling deletion request"), 500);
    }
  },

  async createSignedExportFile(input: {
    userId: string;
    fileContent: string;
    contentType: string;
    fileExtension: string;
  }): Promise<ServiceResult<{ downloadUrl: string }>> {
    if (!input?.userId) return fail("VALIDATION", "User ID is required", 400);
    if (!input.fileContent) return fail("VALIDATION", "File content is required", 400);
    if (!input.contentType) return fail("VALIDATION", "Content type is required", 400);
    if (!input.fileExtension) return fail("VALIDATION", "File extension is required", 400);

    try {
      const storage = getAdminStorage();
      const fileName = `data-exports/${input.userId}/user-data-${Date.now()}.${input.fileExtension}`;
      const file = storage.bucket().file(fileName);

      await file.save(input.fileContent, {
        metadata: { contentType: input.contentType }
      });

      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 60 * 60 * 1000 // 1 hour
      });

      return ok({ downloadUrl: signedUrl });
    } catch (error) {
      return fail("UNKNOWN", errMessage(error, "Unknown error creating export file"), 500);
    }
  }
};
