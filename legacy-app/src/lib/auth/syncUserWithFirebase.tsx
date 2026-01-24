// src/lib/auth/syncUserWithFirebase.ts
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { serverTimestamp } from "@/firebase/admin/firestore";
import { logActivity } from "@/firebase/log/logActivity";

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
  try {
    console.log(`Syncing user with Firebase: ${userId}, Provider: ${userData.provider}, Email: ${userData.email}`);

    let firebaseUid = userId;
    let firebaseUser = null;

    try {
      firebaseUser = await getAdminAuth().getUser(firebaseUid);
      console.log(`Found existing Firebase Auth user: ${firebaseUid}`);
    } catch {
      console.log(`User ${firebaseUid} not found in Firebase Auth, attempting to create...`);

      try {
        const userByEmail = await getAdminAuth().getUserByEmail(userData.email);
        if (userByEmail) {
          firebaseUid = userByEmail.uid;
          firebaseUser = userByEmail;
          console.log(`Found user by email: ${userData.email}, ID: ${firebaseUid}`);
        }
      } catch {
        console.log(`No user found with email: ${userData.email}`);
      }

      if (!firebaseUser) {
        console.log(`Creating new Firebase Auth user for ${userData.email}`);

        const userRecord = await getAdminAuth().createUser({
          uid: firebaseUid,
          email: userData.email,
          displayName: userData.name ?? userData.email.split("@")[0],
          photoURL: userData.image,
          emailVerified: true
        });

        firebaseUser = userRecord;
        console.log(`Created basic user in Firebase Auth: ${firebaseUid}`);

        if (userData.provider === "google") {
          await getAdminFirestore()
            .collection("accounts")
            .add({
              userId: firebaseUid,
              type: "oauth",
              provider: "google",
              providerAccountId: userData.providerAccountId ?? `unknown-${Date.now()}`,
              access_token: "placeholder",
              token_type: "bearer",
              scope: "email profile",
              id_token: "placeholder",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });

          console.log(`Added Google provider link in accounts collection for user: ${firebaseUid}`);
        }
      }
    }

    const userDocRef = getAdminFirestore().collection("users").doc(firebaseUid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      const usersSnapshot = await getAdminFirestore().collection("users").count().get();
      const isFirstUser = usersSnapshot.data().count === 0;
      const role = isFirstUser ? "admin" : "user";

      console.log(`Creating new Firestore user document for ${userData.email} with role ${role}`);

      await userDocRef.set({
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

      await getAdminAuth().setCustomUserClaims(firebaseUid, { role });

      await logActivity({
        userId: firebaseUid,
        type: "register",
        description: `Account created via ${userData.provider}`,
        status: "success",
        metadata: {
          provider: userData.provider,
          email: userData.email
        }
      });

      return { isNewUser: true, role, uid: firebaseUid };
    } else {
      const existingUserData = userDoc.data();
      console.log(`Updating existing user document for ${userData.email}`);

      await userDocRef.update({
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(userData.name && { name: userData.name }),
        ...(userData.image && { photoURL: userData.image })
      });

      await logActivity({
        userId: firebaseUid,
        type: "login",
        description: `Logged in with ${userData.provider}`,
        status: "success",
        metadata: {
          provider: userData.provider,
          email: userData.email
        }
      });

      return {
        isNewUser: false,
        role: existingUserData?.role || "user",
        uid: firebaseUid
      };
    }
  } catch (error) {
    console.error("Error syncing user with Firebase:", error);
    await logActivity({
      userId: userId,
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
