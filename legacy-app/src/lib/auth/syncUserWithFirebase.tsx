import { adminAuthService } from "@/lib/services/admin-auth-service";
import { adminAccountsService } from "@/lib/services/admin-accounts-service";
import { serverTimestamp } from "@/firebase/admin/firestore";
import { logActivity } from "@/firebase/actions";
import type { UserRole } from "@/types/user";

type SyncInput = {
  email: string;
  name?: string;
  image?: string;
  provider: string;
  providerAccountId?: string;
};

type SyncResult = {
  isNewUser: boolean;
  role: UserRole;
  uid: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function inferRole(role: unknown): UserRole {
  return role === "admin" ? "admin" : "user";
}

/**
 * Synchronizes a user between NextAuth.js and Firebase.
 * Service-based: no direct Admin SDK usage in this file.
 */
export async function syncUserWithFirebase(userId: string, userData: SyncInput): Promise<SyncResult> {
  const email = normalizeEmail(userData.email);

  try {
    console.log(`Syncing user with Firebase: ${userId}, Provider: ${userData.provider}, Email: ${email}`);

    // 1) Ensure a Firebase Auth user exists
    let firebaseUid = userId;

    // Try by uid
    const byId = await adminAuthService.getAuthUserById(firebaseUid);
    if (!byId.success) {
      // Try by email
      const byEmail = await adminAuthService.getAuthUserByEmail(email);
      if (byEmail.success) {
        firebaseUid = byEmail.data.uid;
      } else {
        // Create new auth user with the requested uid (no password)
        const created = await adminAuthService.createAuthUserWithUid({
          uid: firebaseUid,
          email,
          displayName: userData.name ?? email.split("@")[0],
          photoURL: userData.image,
          emailVerified: true
        });

        if (!created.success) {
          throw new Error(created.error);
        }

        // Optional: create a minimal accounts link for Google provider parity
        if (userData.provider === "google") {
          const providerAccountId = userData.providerAccountId ?? `unknown-${Date.now()}`;
          await adminAccountsService.createGoogleAccountLink({
            userId: firebaseUid,
            providerAccountId
          });
        }
      }
    }

    // 2) Ensure Firestore user doc exists
    const existingUserDocRes = await adminAuthService.getUserDocById(firebaseUid);
    if (!existingUserDocRes.success) {
      throw new Error(existingUserDocRes.error);
    }

    const existingUser = existingUserDocRes.data.user;

    if (!existingUser) {
      // Determine role (first user = admin)
      const countRes = await adminAuthService.countUsers();
      if (!countRes.success) throw new Error(countRes.error);

      const isFirstUser = countRes.data.count === 0;
      const role: UserRole = isFirstUser ? "admin" : "user";

      const createDocRes = await adminAuthService.createUserDoc(firebaseUid, {
        email,
        name: userData.name ?? email.split("@")[0],
        photoURL: userData.image,
        role,
        provider: userData.provider,
        emailVerified: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      if (!createDocRes.success) throw new Error(createDocRes.error);

      // Set custom claim
      const claimRes = await adminAuthService.setUserRoleClaim(firebaseUid, role);
      if (!claimRes.success) throw new Error(claimRes.error);

      await logActivity({
        userId: firebaseUid,
        type: "register",
        description: `Account created via ${userData.provider}`,
        status: "success",
        metadata: { provider: userData.provider, email }
      });

      return { isNewUser: true, role, uid: firebaseUid };
    }

    // 3) Update lastLoginAt / basic profile fields
    const updateRes = await adminAuthService.updateUserDoc(firebaseUid, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(userData.name ? { name: userData.name } : {}),
      ...(userData.image ? { photoURL: userData.image } : {})
    });

    if (!updateRes.success) throw new Error(updateRes.error);

    await logActivity({
      userId: firebaseUid,
      type: "login",
      description: `Logged in with ${userData.provider}`,
      status: "success",
      metadata: { provider: userData.provider, email }
    });

    const role = inferRole(existingUser?.role);

    return { isNewUser: false, role, uid: firebaseUid };
  } catch (error) {
    console.error("Error syncing user with Firebase:", error);

    await logActivity({
      userId,
      type: "error",
      description: "Failed to sync user with Firebase",
      status: "error",
      metadata: {
        error: error instanceof Error ? error.message : "Unknown error",
        provider: userData.provider,
        email
      }
    });

    throw error;
  }
}
