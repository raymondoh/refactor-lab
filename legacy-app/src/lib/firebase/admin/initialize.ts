// This file provides a safe way to initialize Firebase Admin SDK

import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

// Track initialization state
let adminApp: App | undefined;

// Safe initialization function that checks if already initialized
export function getAdminApp() {
  if (adminApp) {
    return adminApp;
  }

  // Check if any Firebase admin apps have been initialized
  const apps = getApps();

  if (apps.length > 0) {
    // If already initialized, use the existing app
    adminApp = apps[0];
    return adminApp;
  }

  // Environment validation
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error("Firebase Admin SDK credentials are missing. Please check your environment variables.");
  }

  // Initialize the app
  try {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key comes as a string with \n characters
        // We need to replace them with actual newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

    return adminApp;
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    throw new Error("Failed to initialize Firebase Admin SDK");
  }
}

// Firestore with lazy initialization
export function getAdminFirestore() {
  const app = getAdminApp();
  return getFirestore(app);
}

// Auth with lazy initialization
export function getAdminAuth() {
  const app = getAdminApp();
  return getAuth(app);
}

// Storage with lazy initialization
export function getAdminStorage() {
  const app = getAdminApp();
  return getStorage(app);
}

// Legacy compatibility - these match your current function names
// export const adminDb = getAdminFirestore;
// export const adminAuth = getAdminAuth;
// export const adminStorage = getAdminStorage;
