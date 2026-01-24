import { getAdminAuth, getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

// Create user in Firebase
export async function createUserInFirebase(userData: any) {
  try {
    const auth = getAdminAuth();
    const db = getAdminFirestore();

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.name
    });

    // Create user document in Firestore
    await db
      .collection("users")
      .doc(userRecord.uid)
      .set({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

    return { success: true, data: userRecord };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error creating user";
    return { success: false, error: message };
  }
}

// Verify and create user
export async function verifyAndCreateUser(userData: any) {
  try {
    const auth = getAdminAuth();
    const db = getAdminFirestore();

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.name
    });

    // Create user document in Firestore
    await db
      .collection("users")
      .doc(userRecord.uid)
      .set({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

    return { success: true, data: userRecord };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error creating user";
    return { success: false, error: message };
  }
}

// Delete user as admin
export async function deleteUserAsAdmin(userId: string) {
  try {
    const auth = getAdminAuth();
    const db = getAdminFirestore();

    // Delete from Firebase Auth
    await auth.deleteUser(userId);

    // Delete from Firestore
    await db.collection("users").doc(userId).delete();

    return { success: true };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error deleting user";
    return { success: false, error: message };
  }
}

// Delete user image
export async function deleteUserImage(imageUrl: string) {
  try {
    const storage = getAdminStorage();
    const bucket = storage.bucket();

    // Extract the file path from the URL
    const url = new URL(imageUrl);
    const fullPath = url.pathname.slice(1); // Remove leading slash
    const storagePath = fullPath.replace(`${bucket.name}/`, "");

    await bucket.file(storagePath).delete();

    return { success: true };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error deleting user image";
    console.error("❌ Error deleting user image:", message);
    return { success: false, error: message };
  }
}

// Get user
export async function getUser(userId: string) {
  try {
    const auth = getAdminAuth();
    const userRecord = await auth.getUser(userId);
    return { success: true, data: userRecord };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error getting user";
    return { success: false, error: message };
  }
}

// Update user
export async function updateUser(userId: string, userData: any) {
  try {
    const auth = getAdminAuth();
    const db = getAdminFirestore();

    // Update Firebase Auth
    await auth.updateUser(userId, userData);

    // Update Firestore document
    await db
      .collection("users")
      .doc(userId)
      .update({
        ...userData,
        updatedAt: new Date()
      });

    return { success: true };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error updating user";
    return { success: false, error: message };
  }
}

// Get user by email
export async function getUserByEmail(email: string) {
  try {
    const auth = getAdminAuth();
    const userRecord = await auth.getUserByEmail(email);
    return { success: true, data: userRecord };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error getting user by email";
    return { success: false, error: message };
  }
}

// Get user from token
export async function getUserFromToken(token: string) {
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const userRecord = await auth.getUser(decodedToken.uid);
    return { success: true, data: userRecord };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error getting user from token";
    return { success: false, error: message };
  }
}

// Set custom claims
export async function setCustomClaims(userId: string, claims: any) {
  try {
    const auth = getAdminAuth();
    await auth.setCustomUserClaims(userId, claims);
    return { success: true };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error setting custom claims";
    return { success: false, error: message };
  }
}

// Send reset password email
export async function sendResetPasswordEmail(email: string) {
  try {
    const auth = getAdminAuth();
    await auth.generatePasswordResetLink(email);
    return { success: true };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error sending reset email";
    return { success: false, error: message };
  }
}

// Verify ID token
export async function verifyIdToken(token: string) {
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    return { success: true, data: decodedToken };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error verifying token";
    return { success: false, error: message };
  }
}

// Legacy compatibility - these match your current function names
export const adminAuth = getAdminAuth;
export const adminDb = getAdminFirestore;
export const adminStorage = getAdminStorage;
