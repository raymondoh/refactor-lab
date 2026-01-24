// src/lib/firebase/client.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, signInWithCustomToken, connectAuthEmulator } from "firebase/auth";
import { getFirestore, type Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, type FirebaseStorage, connectStorageEmulator } from "firebase/storage";
import { getEnv, isServer } from "@/lib/env";
import { clientLogger } from "@/lib/utils/logger";
import { logger } from "@/lib/logger";

// Singleton references
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;

// Ensure emulators are connected only once
let emulatorsConnected = false;

// Firebase config
function getFirebaseConfig() {
  if (isServer) {
    // Minimal placeholder for build-time
    return {
      apiKey: "build-placeholder",
      authDomain: "build-placeholder",
      projectId: "build-placeholder"
    };
  }
  const env = getEnv();
  const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";

  return {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId,
    storageBucket:
      env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      "plumbers-portal.firebasestorage.app",
    messagingSenderId:
      env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };
}

function shouldUseEmulators() {
  if (isServer) return false;
  const env = getEnv();

  return env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
}

function connectEmulatorsIfNeeded() {
  if (emulatorsConnected) return;
  if (!shouldUseEmulators()) return;

  // Safety: only connect if instances exist
  if (firebaseAuth) {
    // IMPORTANT: connectAuthEmulator must be called before other auth operations
    connectAuthEmulator(firebaseAuth, "http://127.0.0.1:9099", { disableWarnings: true });
  }

  if (firebaseDb) {
    connectFirestoreEmulator(firebaseDb, "127.0.0.1", 8080);
    clientLogger.info("🔥 Firestore emulator connected", { host: "127.0.0.1", port: 8080 });
  }

  // Optional: only if you're running Storage emulator (you didn't list it in your emulator output,
  // but this is safe — it won't be used unless you start the storage emulator + wire it).
  //if (firebaseStorage) {
  // If you don't run storage emulator, you can comment this out.
  // connectStorageEmulator(firebaseStorage, "127.0.0.1", 9199);
  //}

  emulatorsConnected = true;
  clientLogger.info("✅ Firebase client connected to emulators", {
    auth: "127.0.0.1:9099",
    firestore: "127.0.0.1:8080",
    storage: "127.0.0.1:9199"
  });
}

// Initialize Firebase (singleton)
function initFirebase() {
  if (isServer) {
    clientLogger.info("Skipping Firebase client initialization during build");
    return { app: null, auth: null, db: null, storage: null };
  }

  if (!firebaseApp) {
    firebaseApp = getApps().length ? getApps()[0] : initializeApp(getFirebaseConfig());
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    firebaseStorage = getStorage(firebaseApp);

    // 👇 Connect emulators right after initializing instances
    connectEmulatorsIfNeeded();
  } else {
    // In case app exists but emulators haven't been connected yet
    connectEmulatorsIfNeeded();
  }

  return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb, storage: firebaseStorage };
}

// Export instances (lazy init)
export const getFirebaseApp = () => {
  if (!firebaseApp) initFirebase();
  return firebaseApp;
};

export const getFirebaseAuth = () => {
  if (!firebaseAuth) initFirebase();
  // Make sure emulators connect even if auth is the first getter called
  connectEmulatorsIfNeeded();
  return firebaseAuth;
};

export const getFirebaseDb = () => {
  if (!firebaseDb) initFirebase();
  // Make sure emulators connect even if db is the first getter called
  connectEmulatorsIfNeeded();
  return firebaseDb;
};

export const getFirebaseStorage = () => {
  if (!firebaseStorage) initFirebase();
  connectEmulatorsIfNeeded();
  return firebaseStorage;
};

// Ensure Firebase is signed in with a custom token from our NextAuth session
export const ensureFirebaseAuth = async () => {
  if (isServer) return null;

  const authInstance = getFirebaseAuth();
  if (!authInstance) return null;

  if (authInstance.currentUser) return authInstance.currentUser;

  try {
    // Use a relative URL so the browser always talks to the current origin
    const res = await fetch("/api/firebase/token");
    if (!res.ok) throw new Error("Failed to fetch Firebase token");
    const { token } = await res.json();
    await signInWithCustomToken(authInstance, token);
    return authInstance.currentUser;
  } catch (error) {
    logger.error("Firebase sign-in failed:", error);
    return null;
  }
};
