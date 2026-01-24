// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import "@/lib/firebase/admin"; // lazy admin init

export async function GET() {
  let adminOk = false;

  try {
    // If admin is initialized, this shouldn't throw
    if (getApps().length) {
      // Lightweight ping to Firestore to confirm admin SDK works
      await getFirestore().listCollections();
      adminOk = true;
    }
  } catch {
    // Health endpoints must stay silent on errors
  }

  const {
    NEXT_PUBLIC_APP_MODE,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    AUTH_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_APP_URL,
    NEXTAUTH_URL,
    NEXT_PUBLIC_MAINTENANCE_MODE,
    NEXT_PUBLIC_ALGOLIA_APP_ID,
    NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY,
    NEXT_PUBLIC_ALGOLIA_INDEX_USERS,
    NEXT_PUBLIC_ALGOLIA_INDEX_JOBS,
    ALGOLIA_APPID,
    ALGOLIA_ADMIN_API_KEY,
    ALGOLIA_ADMINKEY,
    ALGOLIA_INDEX_USERS,
    ALGOLIA_INDEX_JOBS
  } = process.env;

  // Resolve Algolia index names from env with sensible fallbacks
  const resolvedUsersIndex = NEXT_PUBLIC_ALGOLIA_INDEX_USERS || ALGOLIA_INDEX_USERS || "plumbers";
  const resolvedJobsIndex = NEXT_PUBLIC_ALGOLIA_INDEX_JOBS || ALGOLIA_INDEX_JOBS || "jobs";

  // Basic "mode" indicator for Algolia based on index names
  const algoliaMode = resolvedUsersIndex.endsWith("_dev") || resolvedJobsIndex.endsWith("_dev") ? "dev" : "prod";

  // Is the app runtime configured with Algolia admin credentials?
  const algoliaAdminConfigured = Boolean(ALGOLIA_APPID && (ALGOLIA_ADMIN_API_KEY || ALGOLIA_ADMINKEY));

  // Rough Firebase env role based on project id naming
  const firebaseProjectId = NEXT_PUBLIC_FIREBASE_PROJECT_ID || AUTH_FIREBASE_PROJECT_ID;
  const firebaseEnvRole = firebaseProjectId ? (firebaseProjectId.endsWith("-dev") ? "dev" : "prod") : "unknown";

  return NextResponse.json({
    ok: true,
    adminOk,
    env: {
      // Core app + Firebase
      NEXT_PUBLIC_APP_MODE,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      AUTH_FIREBASE_PROJECT_ID,
      firebaseEnvRole,
      NEXT_PUBLIC_APP_URL,
      NEXTAUTH_URL,
      NEXT_PUBLIC_MAINTENANCE_MODE,

      // Algolia app IDs / keys (never expose raw secrets)
      ALGOLIA_APPID: ALGOLIA_APPID ? "set" : "unset",
      NEXT_PUBLIC_ALGOLIA_APP_ID: NEXT_PUBLIC_ALGOLIA_APP_ID ? "set" : "unset",
      NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY: NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY ? "set" : "unset",
      ALGOLIA_ADMIN_API_KEY: ALGOLIA_ADMIN_API_KEY ? "set" : "unset",
      ALGOLIA_ADMINKEY: ALGOLIA_ADMINKEY ? "set" : "unset",
      algoliaAdminConfigured,
      algoliaMode,

      // Algolia index names (resolved + raw-ish)
      NEXT_PUBLIC_ALGOLIA_INDEX_USERS: resolvedUsersIndex,
      NEXT_PUBLIC_ALGOLIA_INDEX_JOBS: resolvedJobsIndex,
      ALGOLIA_INDEX_USERS: ALGOLIA_INDEX_USERS || "unset",
      ALGOLIA_INDEX_JOBS: ALGOLIA_INDEX_JOBS || "unset"
    }
  });
}
