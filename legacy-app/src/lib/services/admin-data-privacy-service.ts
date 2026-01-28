// src/lib/services/admin-data-privacy-service.ts
import { getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import type { ServiceResponse } from "@/types/service-response";

export const adminDataPrivacyService = {
  async listDeletionRequests(): Promise<
    ServiceResponse<{ users: Array<{ id: string; email?: string; name?: string }> }>
  > {
    try {
      const db = getAdminFirestore();
      const snapshot = await db.collection("users").where("deletionRequested", "==", true).get();

      const users = snapshot.docs.map(d => {
        const data = d.data() as any;
        return { id: d.id, email: data.email, name: data.name };
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
  ): Promise<ServiceResponse<{ user: any; likes: any[]; activity: any[]; orders?: any[] }>> {
    try {
      const db = getAdminFirestore();

      const userDoc = await db.collection("users").doc(userId).get();
      const user = userDoc.exists ? { id: userDoc.id, ...(userDoc.data() as any) } : null;

      const likesSnapshot = await db.collection("users").doc(userId).collection("likes").get();
      const likes = likesSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

      const activitySnapshot = await db.collection("activity").where("userId", "==", userId).get();
      const activity = activitySnapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

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

  async markDeletionRequested(userId: string): Promise<ServiceResponse<{}>> {
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
  async deleteUserLikesAndProfileImage(userId: string): Promise<ServiceResponse<{}>> {
    try {
      const db = getAdminFirestore();
      const storage = getAdminStorage();

      // Get user data (for picture cleanup)
      const userRef = db.collection("users").doc(userId);
      const userSnap = await userRef.get();
      const userData = userSnap.data() as any;

      // Delete user's profile image if exists (non-fatal)
      if (userData?.picture) {
        try {
          const bucket = storage.bucket();
          const url = new URL(userData.picture);
          const fullPath = url.pathname.slice(1); // remove leading "/"
          const storagePath = fullPath.replace(`${bucket.name}/`, "");
          await bucket.file(storagePath).delete();
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
