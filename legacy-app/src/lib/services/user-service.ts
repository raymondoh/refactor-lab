// legacy-app/src/lib/services/user-service.ts
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { Timestamp } from "firebase-admin/firestore";

import type { User, UserRole } from "@/types/models/user";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { getUserImage } from "@/utils/get-user-image";
import type { ServiceResponse } from "@/lib/services/types/service-response";

// User service class
export class UserService {
  // Get users with pagination (general use; NOT admin gated)
  static async getUsers(
    limit = 10,
    startAfter?: string
  ): Promise<
    ServiceResponse<{
      users: User[];
      lastVisible?: string;
    }>
  > {
    try {
      const db = getAdminFirestore();
      let query = db.collection("users").orderBy("createdAt", "desc").limit(limit);

      if (startAfter) {
        const lastDoc = await db.collection("users").doc(startAfter).get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }

      const snapshot = await query.get();

      const users: User[] = snapshot.docs.map(doc => {
        const data = doc.data() as any;

        return {
          id: doc.id,
          ...data,
          image: getUserImage(data),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          lastLoginAt:
            data.lastLoginAt instanceof Timestamp ? data.lastLoginAt.toDate().toISOString() : data.lastLoginAt,
          emailVerified: Boolean(data.emailVerified) // ✅ boolean
        } as User;
      });

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];

      return {
        success: true,
        data: {
          users,
          lastVisible: lastVisible?.id
        }
      };
    } catch (error: unknown) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error occurred while fetching users";

      console.error("Error fetching users:", message);
      return { success: false, error: message };
    }
  }

  // Get current user (safely)
  static async getCurrentUser(): Promise<ServiceResponse<User>> {
    try {
      const { auth } = await import("@/auth");
      const session = await auth();

      if (!session?.user) {
        return { success: false, error: "No authenticated user found" };
      }

      const role = await UserService.getUserRole(session.user.id);

      return {
        success: true,
        data: {
          id: session.user.id,
          firstName: session.user.firstName || "",
          lastName: session.user.lastName || "",
          displayName: session.user.displayName || "",
          name: session.user.name || "",
          email: session.user.email || "",
          image: getUserImage(session.user),
          role,
          bio: session.user.bio || ""
        }
      };
    } catch (error: unknown) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error getting current user";

      return { success: false, error: message };
    }
  }

  // Get user role
  static async getUserRole(userId: string): Promise<UserRole> {
    try {
      const db = getAdminFirestore();
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data() as any;
      return (userData?.role as UserRole) || "user";
    } catch (error: unknown) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error getting user role";

      console.error("Error getting user role:", message);
      return "user";
    }
  }
}
