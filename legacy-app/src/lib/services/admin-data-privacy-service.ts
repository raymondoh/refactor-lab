// src/lib/services/admin-data-privacy-service.ts
import { getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import type { ServiceResponse } from "@/types/service-response";

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

type ExportedDoc = Record<string, unknown> & { id: string };
type ExportedUser = (Record<string, unknown> & { id: string }) | null;

export const adminDataPrivacyService = {
  async listDeletionRequests(): Promise<
    ServiceResponse<{ users: Array<{ id: string; email?: string; name?: string }> }>
  > {
    try {
      const db = getAdminFirestore();
      const snapshot = await db.collection("users").where("deletionRequested", "==", true).get();

      const users = snapshot.docs.map(d => {
        const data = asRecord(d.data());
        return { id: d.id, email: getStringField(data, "email"), name: getStringField(data, "name") };
      });

      return { success: true, data: { users } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error listing deletion requests";
      return { success: false, error: message, status: 500 };
    }
  },

  async exportUserData(
    userId: string
  ): Promise<
    ServiceResponse<{ user: ExportedUser; likes: ExportedDoc[]; activity: ExportedDoc[]; orders?: ExportedDoc[] }>
  > {
    try {
      const db = getAdminFirestore();

      const userDoc = await db.collection("users").doc(userId).get();
      const user: ExportedUser = userDoc.exists ? ({ id: userDoc.id, ...(userDoc.data() ?? {}) } as ExportedDoc) : null;

      const likesSnapshot = await db.collection("users").doc(userId).collection("likes").get();
      const likes = likesSnapshot.docs.map(d => ({ id: d.id, ...(d.data() ?? {}) }) as ExportedDoc);

      const activitySnapshot = await db.collection("activity").where("userId", "==", userId).get();
      const activity = activitySnapshot.docs.map(d => ({ id: d.id, ...(d.data() ?? {}) }) as ExportedDoc);

      // If you later export orders, follow the same pattern:
      // const ordersSnap = await db.collection("orders").where("userId", "==", userId).get();
      // const orders = ordersSnap.docs.map(d => ({ id: d.id, ...(d.data() ?? {}) })) as ExportedDoc[];

      return { success: true, data: { user, likes, activity } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error exporting user data";
      return { success: false, error: message, status: 500 };
    }
  },

  async markDeletionRequested(userId: string): Promise<ServiceResponse<Record<string, never>>> {
    try {
      const db = getAdminFirestore();
      await db.collection("users").doc(userId).update({ deletionRequested: true });
      return { success: true, data: {} };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error updating deletion flag";
      return { success: false, error: message, status: 500 };
    }
  },

  async deleteUserStorageFolder(prefix: string): Promise<ServiceResponse<{ deleted: boolean }>> {
    // prefix example: `users/${userId}/` depending on your storage paths
    try {
      const storage = getAdminStorage().bucket();
      await storage.deleteFiles({ prefix });
      return { success: true, data: { deleted: true } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error deleting user storage";
      // storage cleanup shouldn’t block everything—keep status non-fatal if you like
      return { success: false, error: message, status: 500 };
    }
  },

  /**
   * Deletes user-owned "likes" docs and attempts to delete the profile image referenced by `users/{userId}.picture`.
   * Does NOT delete the user doc itself (leave that to adminAuthService.deleteUserAuthAndDoc).
   */
  async deleteUserLikesAndProfileImage(userId: string): Promise<ServiceResponse<Record<string, never>>> {
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

      return { success: true, data: {} };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error deleting user likes/profile image";
      return { success: false, error: message, status: 500 };
    }
  },
  async cancelDeletionRequested(userId: string): Promise<ServiceResponse<Record<string, never>>> {
    try {
      const db = getAdminFirestore();
      await db.collection("users").doc(userId).update({
        deletionRequested: false,
        deletionRequestedAt: null,
        deletionRejectedAt: null,
        deletionRejectedBy: null
      });
      return { success: true, data: {} };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error cancelling deletion request";
      return { success: false, error: message, status: 500 };
    }
  },

  async createSignedExportFile(input: {
    userId: string;
    fileContent: string;
    contentType: string;
    fileExtension: string;
  }): Promise<ServiceResponse<{ downloadUrl: string }>> {
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

      return { success: true, data: { downloadUrl: signedUrl } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error creating export file";
      return { success: false, error: message, status: 500 };
    }
  }
};
