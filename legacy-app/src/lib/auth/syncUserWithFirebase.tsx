// src/lib/auth/syncUserWithFirebase.ts
import { serverTimestamp } from "@/firebase/admin/firestore";
import { logActivity } from "@/firebase/actions";

/**
 * Synchronizes a user between NextAuth.js and Firebase
 * Works with any authentication provider
 */
export async function syncUserWithFirebase(
  userId: string,
  userData: {
    email: string;
    name?: string;
    image?: string;
    provider: string;
    providerAccountId?: string;
  }
) {
  const { adminAuthService } = await import("@/lib/services/admin-auth-service");
  const { adminUserService } = await import("@/lib/services/admin-user-service");

  try {
    console.log(`Syncing user with Firebase: ${userId}, Provider: ${userData.provider}, Email: ${userData.email}`);

    let firebaseUid = userId;

    // 1) Try to load Auth user by uid
    let authUserRes = await adminAuthService.getAuthUserById(firebaseUid);

    // 2) If missing, try by email
    if (!authUserRes.success) {
      const byEmailRes = await adminAuthService.getUserByEmail(userData.email);

      if (byEmailRes.success) {
        firebaseUid = byEmailRes.data.uid;
        authUserRes = await adminAuthService.getAuthUserById(firebaseUid);
        console.log(`Found Auth user by email: ${userData.email}, uid: ${firebaseUid}`);
      }
    }

    // 3) If still missing, create Auth user (provider-safe, no password)
    if (!authUserRes.success) {
      console.log(`Creating new Firebase Auth user for ${userData.email}`);

      const createdRes = await adminAuthService.createProviderAuthUser({
        email: userData.email,
        displayName: userData.name ?? userData.email.split("@")[0],
        photoURL: userData.image,
        emailVerified: true
      });

      if (!createdRes.success) throw new Error(createdRes.error);

      firebaseUid = createdRes.data.uid;

      authUserRes = await adminAuthService.getAuthUserById(firebaseUid);
      console.log(`Created Firebase Auth user: ${firebaseUid}`);
    }

    // 4) Ensure Firestore user doc exists
    const userDocRes = await adminUserService.getUserById(firebaseUid);
    if (!userDocRes.success) throw new Error(userDocRes.error);

    if (!userDocRes.data) {
      const countRes = await adminUserService.countUsers();
      const count = countRes.success ? countRes.data.count : 0;
      const isFirstUser = count === 0;
      const role = isFirstUser ? "admin" : "user";

      console.log(`Creating new Firestore user document for ${userData.email} with role ${role}`);

      const createDocRes = await adminUserService.createUserDoc(firebaseUid, {
        email: userData.email,
        name: userData.name ?? userData.email.split("@")[0],
        photoURL: userData.image,
        role,
        provider: userData.provider,
        emailVerified: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      if (!createDocRes.success) throw new Error(createDocRes.error);

      const claimRes = await adminAuthService.setUserRoleClaim(firebaseUid, role);
      if (!claimRes.success) throw new Error(claimRes.error);

      await logActivity({
        userId: firebaseUid,
        type: "register",
        description: `Account created via ${userData.provider}`,
        status: "success",
        metadata: { provider: userData.provider, email: userData.email }
      });

      return { isNewUser: true, role, uid: firebaseUid };
    }

    // 5) Update existing user doc
    console.log(`Updating existing user document for ${userData.email}`);

    const patch: Record<string, unknown> = {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    if (userData.name) patch.name = userData.name;
    if (userData.image) patch.photoURL = userData.image;

    const patchRes = await adminUserService.patchUser(firebaseUid, patch);
    if (!patchRes.success) throw new Error(patchRes.error);

    await logActivity({
      userId: firebaseUid,
      type: "login",
      description: `Logged in with ${userData.provider}`,
      status: "success",
      metadata: { provider: userData.provider, email: userData.email }
    });

    const role = (userDocRes.data as any)?.role || "user";
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
        email: userData.email
      }
    });

    throw error;
  }
}
