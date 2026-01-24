// // // src/firebase/client/firebase-client-init.ts

"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Add validation and log environment variables to help debug
const firebaseConfigKeys = Object.keys(firebaseConfig) as Array<keyof typeof firebaseConfig>;
const missingVariables = firebaseConfigKeys.filter(key => !firebaseConfig[key]);

if (missingVariables.length > 0) {
  console.error(`Missing Firebase environment variables: ${missingVariables.join(", ")}`);
  throw new Error(`Missing Firebase environment variables: ${missingVariables.join(", ")}`);
} else {
  console.log("Firebase environment variables are all set.");
}

// Initialize client app if it doesn't exist
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();
