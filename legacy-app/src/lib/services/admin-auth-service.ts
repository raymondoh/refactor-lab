// src/lib/services/admin-auth-service.ts
import { getAdminAuth, getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import type { ServiceResponse } from "@/types/service-response";
import bcryptjs from "bcryptjs";
import type { UserRole } from "@/types/models/user";
import type { DecodedIdToken } from "firebase-admin/auth";

function toUserRole(value: unknown): UserRole {
  return value === "admin" ? "admin" : "user";
}

function errMessage(error: unknown, fallback: string) {
  return isFirebaseError(error) ? firebaseError(error) : error instanceof Error ? error.message : fallback;
}

/** Prefer a non-empty object type for "no payload" responses */
type EmptyData = Record<string, never>;

type UserDoc = { id: string } & Record<string, unknown>;

export const adminAuthService = {
  async getUserByEmail(email: string): Promise<ServiceResponse<{ uid: string; role?: UserRole }>> {
    try {
      const auth = getAdminAuth();
      const db = getAdminFirestore();

      const userRecord = await auth.getUserByEmail(email);

      // optional: also fetch role from Firestore if present
      const snap = await db.collection("users").doc(userRecord.uid).get();
      const data = snap.data() as Record<string, unknown> | undefined;
      const role = snap.exists ? toUserRole(data?.role) : undefined;

      return { success: true, data: { uid: userRecord.uid, role } };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error"), status: 500 };
    }
  },

  async markEmailVerified(userId: string): Promise<ServiceResponse<EmptyData>> {
    try {
      const auth = getAdminAuth();
      const db = getAdminFirestore();

      await auth.updateUser(userId, { emailVerified: true });
      await db.collection("users").doc(userId).update({ emailVerified: true });

      return { success: true, data: {} };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error verifying email"), status: 500 };
    }
  },

  async getAuthUserByEmail(
    email: string
  ): Promise<ServiceResponse<{ uid: string; emailVerified: boolean; displayName?: string | null }>> {
    try {
      const auth = getAdminAuth();
      const userRecord = await auth.getUserByEmail(email);

      return {
        success: true,
        data: {
          uid: userRecord.uid,
          emailVerified: userRecord.emailVerified,
          displayName: userRecord.displayName ?? null
        }
      };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error getting auth user by email"), status: 500 };
    }
  },

  async verifyPasswordHash(
    userId: string,
    password: string
  ): Promise<ServiceResponse<{ ok: boolean; role?: UserRole }>> {
    try {
      const db = getAdminFirestore();
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data() as Record<string, unknown> | undefined;

      const hash = typeof userData?.passwordHash === "string" ? userData.passwordHash : undefined;
      if (!hash) return { success: true, data: { ok: false } };

      const ok = await bcryptjs.compare(password, hash);
      const role = toUserRole(userData?.role);

      return { success: true, data: { ok, role } };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error verifying password hash"), status: 500 };
    }
  },

  async createCustomToken(userId: string): Promise<ServiceResponse<{ token: string }>> {
    try {
      const auth = getAdminAuth();
      const token = await auth.createCustomToken(userId);
      return { success: true, data: { token } };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error creating custom token"), status: 500 };
    }
  },

  async deleteUserAuthAndDoc(userId: string): Promise<ServiceResponse<EmptyData>> {
    try {
      const auth = getAdminAuth();
      const db = getAdminFirestore();

      await db
        .collection("users")
        .doc(userId)
        .delete()
        .catch(() => {
          // ignore missing
        });

      await auth.deleteUser(userId);

      return { success: true, data: {} };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error deleting user"), status: 500 };
    }
  },

  async updateAuthUser(
    userId: string,
    data: { email?: string; displayName?: string; password?: string; photoURL?: string; emailVerified?: boolean }
  ): Promise<ServiceResponse<EmptyData>> {
    try {
      const auth = getAdminAuth();
      await auth.updateUser(userId, data);
      return { success: true, data: {} };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error updating auth user"), status: 500 };
    }
  },

  async setUserRoleClaim(userId: string, role: UserRole): Promise<ServiceResponse<EmptyData>> {
    try {
      const auth = getAdminAuth();
      await auth.setCustomUserClaims(userId, { role });
      return { success: true, data: {} };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error setting role claim"), status: 500 };
    }
  },

  async getAuthUserById(userId: string): Promise<
    ServiceResponse<{
      uid: string;
      email?: string;
      displayName?: string;
      photoURL?: string;
      emailVerified?: boolean;
    }>
  > {
    try {
      const auth = getAdminAuth();
      const u = await auth.getUser(userId);

      return {
        success: true,
        data: {
          uid: u.uid,
          email: u.email ?? undefined,
          displayName: u.displayName ?? undefined,
          photoURL: u.photoURL ?? undefined,
          emailVerified: u.emailVerified
        }
      };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error getting auth user"), status: 500 };
    }
  },

  async getUserDocById(userId: string): Promise<ServiceResponse<{ user: UserDoc | null }>> {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection("users").doc(userId).get();

      const data = snap.data() as Record<string, unknown> | undefined;
      return { success: true, data: { user: snap.exists ? { id: snap.id, ...(data ?? {}) } : null } };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error fetching user doc"), status: 500 };
    }
  },

  async updateUserDoc(userId: string, data: Record<string, unknown>): Promise<ServiceResponse<EmptyData>> {
    try {
      const db = getAdminFirestore();
      await db.collection("users").doc(userId).update(data);
      return { success: true, data: {} };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error updating user doc"), status: 500 };
    }
  },

  // admin creates user with password
  async createAuthUser(data: {
    email: string;
    password: string;
    displayName?: string;
    emailVerified?: boolean;
  }): Promise<ServiceResponse<{ uid: string }>> {
    try {
      const auth = getAdminAuth();
      const user = await auth.createUser(data);
      return { success: true, data: { uid: user.uid } };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error creating auth user"), status: 500 };
    }
  },

  async createProviderAuthUser(data: {
    email: string;
    displayName?: string;
    photoURL?: string;
    emailVerified?: boolean;
  }): Promise<ServiceResponse<{ uid: string }>> {
    try {
      const auth = getAdminAuth();

      const user = await auth.createUser({
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        emailVerified: data.emailVerified ?? true
      });

      return { success: true, data: { uid: user.uid } };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error creating provider auth user"), status: 500 };
    }
  },

  // create user with explicit uid
  async createAuthUserWithUid(input: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    emailVerified?: boolean;
  }): Promise<ServiceResponse<{ uid: string }>> {
    try {
      const auth = getAdminAuth();
      const u = await auth.createUser({
        uid: input.uid,
        email: input.email,
        displayName: input.displayName,
        photoURL: input.photoURL,
        emailVerified: input.emailVerified ?? true
      });
      return { success: true, data: { uid: u.uid } };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error creating auth user"), status: 500 };
    }
  },

  async countUsers(): Promise<ServiceResponse<{ count: number }>> {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection("users").count().get();
      return { success: true, data: { count: snap.data().count } };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error counting users"), status: 500 };
    }
  },

  async createUserDoc(userId: string, data: Record<string, unknown>): Promise<ServiceResponse<EmptyData>> {
    try {
      const db = getAdminFirestore();
      await db.collection("users").doc(userId).set(data);
      return { success: true, data: {} };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error creating user doc"), status: 500 };
    }
  },

  async generateEmailVerificationLink(email: string): Promise<ServiceResponse<{ link: string }>> {
    try {
      const auth = getAdminAuth();
      const link = await auth.generateEmailVerificationLink(email);
      return { success: true, data: { link } };
    } catch (error: unknown) {
      return {
        success: false,
        error: errMessage(error, "Unknown error generating email verification link"),
        status: 500
      };
    }
  },

  async verifyIdToken(token: string): Promise<ServiceResponse<DecodedIdToken>> {
    try {
      const auth = getAdminAuth();
      const decodedToken = await auth.verifyIdToken(token);
      return { success: true, data: decodedToken };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error verifying ID token"), status: 500 };
    }
  },

  async deleteStorageObject(objectPath: string): Promise<ServiceResponse<EmptyData>> {
    try {
      const bucket = getAdminStorage().bucket();
      await bucket.file(objectPath).delete({ ignoreNotFound: true });
      return { success: true, data: {} };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error deleting storage object"), status: 500 };
    }
  },
  /**
   * Verifies a Firebase Out-of-Band (OOB) code via the Google Identity Toolkit REST API.
   * This handles the "applyActionCode" logic on the server side.
   */
  /**
   * Verifies a Firebase Out-of-Band (OOB) code via the Google Identity Toolkit REST API.
   * Uses the confirmEmail endpoint specifically designed for verification links.
   */
  async checkActionCode(oobCode: string): Promise<ServiceResponse<{ email: string; operation: string; uid: string }>> {
    if (!oobCode) return { success: false, error: "No code provided", status: 400 };

    try {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

      // We use the 'resetPassword' check endpoint - strangely, this is the most
      // reliable way in the Firebase REST API to simply "peek" at what an oobCode
      // belongs to (it works for email verification codes too).
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${apiKey}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oobCode })
      });

      const data = await res.json();

      // If this still 404s, it's an API Key or Google Project settings issue.
      if (!res.ok) {
        console.error("[checkActionCode] REST Error:", data.error);
        return { success: false, error: "Verification link is invalid or expired.", status: 400 };
      }

      // Now that we have the email safely, get the UID via Admin SDK
      const auth = getAdminAuth();
      const userRecord = await auth.getUserByEmail(data.email);

      return {
        success: true,
        data: {
          email: data.email,
          uid: userRecord.uid,
          operation: "VERIFY_EMAIL"
        }
      };
    } catch (error: unknown) {
      console.error("[checkActionCode] Admin/Network Error:", error);
      return { success: false, error: "Internal verification error.", status: 500 };
    }
  }
};
