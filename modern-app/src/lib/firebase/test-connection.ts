// src/lib/firebase/test-connection.ts
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin"; // Use accessors
import { config } from "@/lib/config/app-mode";
import { logger } from "@/lib/logger";
import * as admin from "firebase-admin";

export async function testFirebaseConnection() {
  logger.info("🔥 Testing Firebase Connection...");
  logger.info("🔥 App Mode", { mode: config.mode });

  if (config.isMockMode) {
    logger.info("✅ Mock mode - Firebase not needed");
    return { success: true, mode: "mock" };
  }

  const results = {
    adminAuth: false,
    adminDb: false,
    errors: [] as string[]
  };

  // Test Admin SDK
  try {
    // UPDATED: Use the imported instances directly
    const auth = getFirebaseAdminAuth();
    if (auth) {
      // Test admin auth by listing users (limit 1)
      await auth.listUsers(1);
      results.adminAuth = true;
      logger.info("✅ Firebase Admin Auth connected");
    } else {
      results.errors.push("Firebase Admin Auth not initialized");
    }

    const db = getFirebaseAdminDb();
    if (db) {
      db.collection("test");
      results.adminDb = true;
      logger.info("✅ Firebase Admin Firestore connected");

      // 📌 LOG PROJECT / DB IDENTIFICATION HERE
      const adminApp = admin.app();
      console.log("🔥 Firestore Project ID:", adminApp.options.projectId);
      console.log("🔥 Full Firebase Options:", adminApp.options);
    } else {
      results.errors.push("Firebase Admin Firestore not initialized");
    }
  } catch (error) {
    results.errors.push(`Admin SDK Error: ${(error as Error).message}`);
    logger.error("❌ Firebase Admin SDK Error:", error);
  }

  const success = results.adminAuth && results.adminDb;
  logger.info(`🔥 Firebase Connection Test: ${success ? "✅ SUCCESS" : "❌ FAILED"}`);

  if (results.errors.length > 0) {
    logger.warn("🔥 Errors found:");
    results.errors.forEach(error => logger.warn(`   - ${error}`));
  }

  return {
    success,
    mode: "firebase",
    results
  };
}
