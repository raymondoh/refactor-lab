// src/lib/services/admin-auth-service.ts
import { getAdminAuth, getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import type { ServiceResult, ServiceErrorCode } from "@/lib/services/service-result";
import { ok, fail } from "@/lib/services/service-result";
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

function codeFromStatus(status?: number): ServiceErrorCode {
  if (status === 400) return "VALIDATION";
  if (status === 401) return "UNAUTHENTICATED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 429) return "RATE_LIMIT";
  return "UNKNOWN";
}

export const adminAuthService = {
  async getUserByEmail(email: string): Promise<ServiceResult<{ uid: string; role?: UserRole }>> {
    try {
      const auth = getAdminAuth();
      const db = getAdminFirestore();

      const userRecord = await auth.getUserByEmail(email);

      // optional: also fetch role from Firestore if present
      const snap = await db.collection("users").doc(userRecord.uid).get();
      const data = snap.data() as Record<string, unknown> | undefined;
      const role = snap.exists ? toUserRole(data?.role) : undefined;

      return ok({ uid: userRecord.uid, role });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error"), 500);
    }
  },

  async markEmailVerified(userId: string): Promise<ServiceResult<EmptyData>> {
    try {
      const auth = getAdminAuth();
      const db = getAdminFirestore();

      await auth.updateUser(userId, { emailVerified: true });
      await db.collection("users").doc(userId).update({ emailVerified: true });

      return ok({});
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error verifying email"), 500);
    }
  },

  async getAuthUserByEmail(
    email: string
  ): Promise<ServiceResult<{ uid: string; emailVerified: boolean; displayName?: string | null }>> {
    try {
      const auth = getAdminAuth();
      const userRecord = await auth.getUserByEmail(email);

      return ok({
        uid: userRecord.uid,
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName ?? null
      });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error getting auth user by email"), 500);
    }
  },

  async verifyPasswordHash(userId: string, password: string): Promise<ServiceResult<{ ok: boolean; role?: UserRole }>> {
    try {
      const db = getAdminFirestore();
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data() as Record<string, unknown> | undefined;

      const hash = typeof userData?.passwordHash === "string" ? userData.passwordHash : undefined;
      if (!hash) return ok({ ok: false });

      const match = await bcryptjs.compare(password, hash);
      const role = toUserRole(userData?.role);

      return ok({ ok: match, role });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error verifying password hash"), 500);
    }
  },

  async createCustomToken(userId: string): Promise<ServiceResult<{ token: string }>> {
    try {
      const auth = getAdminAuth();
      const token = await auth.createCustomToken(userId);
      return ok({ token });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error creating custom token"), 500);
    }
  },

  async deleteUserAuthAndDoc(userId: string): Promise<ServiceResult<EmptyData>> {
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

      return ok({});
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error deleting user"), 500);
    }
  },

  async updateAuthUser(
    userId: string,
    data: { email?: string; displayName?: string; password?: string; photoURL?: string; emailVerified?: boolean }
  ): Promise<ServiceResult<EmptyData>> {
    try {
      const auth = getAdminAuth();
      await auth.updateUser(userId, data);
      return ok({});
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error updating auth user"), 500);
    }
  },

  async setUserRoleClaim(userId: string, role: UserRole): Promise<ServiceResult<EmptyData>> {
    try {
      const auth = getAdminAuth();
      await auth.setCustomUserClaims(userId, { role });
      return ok({});
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error setting role claim"), 500);
    }
  },

  async getAuthUserById(userId: string): Promise<
    ServiceResult<{
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

      return ok({
        uid: u.uid,
        email: u.email ?? undefined,
        displayName: u.displayName ?? undefined,
        photoURL: u.photoURL ?? undefined,
        emailVerified: u.emailVerified
      });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error getting auth user"), 500);
    }
  },

  async getUserDocById(userId: string): Promise<ServiceResult<{ user: UserDoc | null }>> {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection("users").doc(userId).get();

      const data = snap.data() as Record<string, unknown> | undefined;
      return ok({ user: snap.exists ? { id: snap.id, ...(data ?? {}) } : null });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error fetching user doc"), 500);
    }
  },

  async updateUserDoc(userId: string, data: Record<string, unknown>): Promise<ServiceResult<EmptyData>> {
    try {
      const db = getAdminFirestore();
      await db.collection("users").doc(userId).update(data);
      return ok({});
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error updating user doc"), 500);
    }
  },

  // admin creates user with password
  async createAuthUser(data: {
    email: string;
    password: string;
    displayName?: string;
    emailVerified?: boolean;
  }): Promise<ServiceResult<{ uid: string }>> {
    try {
      const auth = getAdminAuth();
      const user = await auth.createUser(data);
      return ok({ uid: user.uid });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error creating auth user"), 500);
    }
  },

  async createProviderAuthUser(data: {
    email: string;
    displayName?: string;
    photoURL?: string;
    emailVerified?: boolean;
  }): Promise<ServiceResult<{ uid: string }>> {
    try {
      const auth = getAdminAuth();

      const user = await auth.createUser({
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        emailVerified: data.emailVerified ?? true
      });

      return ok({ uid: user.uid });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error creating provider auth user"), 500);
    }
  },

  // create user with explicit uid
  async createAuthUserWithUid(input: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    emailVerified?: boolean;
  }): Promise<ServiceResult<{ uid: string }>> {
    try {
      const auth = getAdminAuth();
      const u = await auth.createUser({
        uid: input.uid,
        email: input.email,
        displayName: input.displayName,
        photoURL: input.photoURL,
        emailVerified: input.emailVerified ?? true
      });
      return ok({ uid: u.uid });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error creating auth user"), 500);
    }
  },

  async countUsers(): Promise<ServiceResult<{ count: number }>> {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection("users").count().get();
      return ok({ count: snap.data().count });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error counting users"), 500);
    }
  },

  async createUserDoc(userId: string, data: Record<string, unknown>): Promise<ServiceResult<EmptyData>> {
    try {
      const db = getAdminFirestore();
      await db.collection("users").doc(userId).set(data);
      return ok({});
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error creating user doc"), 500);
    }
  },

  async generateEmailVerificationLink(email: string): Promise<ServiceResult<{ link: string }>> {
    try {
      const auth = getAdminAuth();
      const link = await auth.generateEmailVerificationLink(email);
      return ok({ link });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error generating email verification link"), 500);
    }
  },

  async verifyIdToken(token: string): Promise<ServiceResult<DecodedIdToken>> {
    try {
      const auth = getAdminAuth();
      const decodedToken = await auth.verifyIdToken(token);
      return ok(decodedToken);
    } catch (error: unknown) {
      return fail("UNAUTHENTICATED", errMessage(error, "Unknown error verifying ID token"), 401);
    }
  },

  async deleteStorageObject(objectPath: string): Promise<ServiceResult<EmptyData>> {
    try {
      const bucket = getAdminStorage().bucket();
      await bucket.file(objectPath).delete({ ignoreNotFound: true });
      return ok({});
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error deleting storage object"), 500);
    }
  },

  /**
   * Verifies a Firebase Out-of-Band (OOB) code via the Google Identity Toolkit REST API.
   * Uses the resetPassword endpoint as a "peek" (works for verify email codes too).
   */
  async checkActionCode(oobCode: string): Promise<ServiceResult<{ email: string; operation: string; uid: string }>> {
    if (!oobCode) return fail("VALIDATION", "No code provided", 400);

    try {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      if (!apiKey) {
        return fail("UNKNOWN", "Missing Firebase API key.", 500);
      }

      const url = `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${apiKey}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oobCode })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("[checkActionCode] REST Error:", data?.error);
        return fail("VALIDATION", "Verification link is invalid or expired.", 400);
      }

      const email = typeof data?.email === "string" ? data.email : "";
      if (!email) {
        return fail("UNKNOWN", "Internal verification error.", 500);
      }

      // Now that we have the email safely, get the UID via Admin SDK
      const auth = getAdminAuth();
      const userRecord = await auth.getUserByEmail(email);

      return ok({
        email,
        uid: userRecord.uid,
        operation: "VERIFY_EMAIL"
      });
    } catch (error: unknown) {
      console.error("[checkActionCode] Admin/Network Error:", error);
      return fail("UNKNOWN", "Internal verification error.", 500);
    }
  }
};
