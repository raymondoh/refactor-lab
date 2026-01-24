// src/actions/dashboard/activity-logs.ts
"use server";

import { getAllActivityLogs, getUserActivityLogs, type ActivityLog } from "@/firebase/admin/activity";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
// Highlight: New imports for user data enrichment
import { getAdminFirestore } from "@/lib/firebase/admin/initialize"; // For accessing Firestore directly
import { getUserImage } from "@/utils/get-user-image"; // Utility to safely get user image URL
import type { SerializedActivity, ActivityLogWithId } from "@/types/firebase/activity"; // Use SerializedActivity for enriched logs
import type { UserRole } from "@/types/user"; // Assuming UserRole is defined here or in types/user

// Define the return type for activity logs actions, using SerializedActivity for enriched logs
type ActivityLogsResult = { success: true; logs: SerializedActivity[] } | { success: false; error: string };

/**
 * Helper function to enrich activity logs with user data (name, email, image).
 * This fetches all users from Firestore to build a map for efficient lookup.
 * For very large user bases, consider optimizing this by fetching only necessary users
 * or using Firebase Admin SDK's auth.getUsers() for better batching.
 */
// src/actions/dashboard/activity-logs.ts

// ... (existing imports and other code)

async function enrichActivityLogs(logs: ActivityLogWithId[]): Promise<SerializedActivity[]> {
  const db = getAdminFirestore();
  const usersMap = new Map<string, { name?: string; email?: string; image?: string | null }>();

  const usersSnapshot = await db.collection("users").get();
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    const userImage = getUserImage(data); // Get the image from the utility
    usersMap.set(doc.id, {
      name: data.name,
      email: data.email,
      image: userImage
    });
    // Highlight: Add this console.log to check user data being mapped
    console.log(`[enrichActivityLogs] Mapped user ID: ${doc.id}, Email: ${data.email}, Image: ${userImage}`);
  });

  return logs.map(log => {
    const user = usersMap.get(log.userId);
    const userEmail = user?.email || log.userEmail;
    const name = user?.name || userEmail?.split("@")[0] || "Unknown User";
    const image = user?.image || log.image || null;

    // Highlight: Add this console.log to check the enriched activity
    console.log(
      `[enrichActivityLogs] Enriched activity ID: ${log.id}, User ID: ${log.userId}, Enriched Email: ${userEmail}, Enriched Image: ${image}`
    );

    const timestamp =
      log.timestamp instanceof Date
        ? log.timestamp.toISOString()
        : typeof log.timestamp === "string"
          ? log.timestamp
          : new Date(log.timestamp.toMillis()).toISOString();

    return {
      ...log,
      name,
      userEmail,
      image,
      timestamp,
      metadata: log.metadata || {}
    } as SerializedActivity;
  });
}

// ... (rest of the file)

// Get all activity logs (admin only)
export async function fetchAllActivityLogs(limit = 100): Promise<ActivityLogsResult> {
  try {
    // Dynamic import to avoid build-time initialization issues in server actions
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Highlight: Dynamic import for UserService to avoid circular dependencies if it depends on auth
    const { UserService } = await import("@/lib/services/user-service");
    const userRole = await UserService.getUserRole(session.user.id);

    if (userRole !== "admin") {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    // Highlight: Call getAllActivityLogs to get the raw logs
    const result = await getAllActivityLogs(limit);

    if (result.success && result.logs) {
      // Highlight: Enrich the fetched logs with user data
      const enrichedLogs = await enrichActivityLogs(result.logs);
      return { success: true, logs: enrichedLogs };
    } else {
      return { success: false, error: result.error || "Failed to fetch activity logs" };
    }
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error fetching activity logs";
    return { success: false, error: message };
  }
}

// Get user activity logs
export async function fetchUserActivityLogs(userId?: string, limit = 100): Promise<ActivityLogsResult> {
  try {
    // Dynamic import for auth
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Use provided userId or current user's ID
    const targetUserId = userId || session.user.id;

    // If requesting another user's logs, check admin permission
    if (targetUserId !== session.user.id) {
      // Dynamic import for UserService
      const { UserService } = await import("@/lib/services/user-service");
      const userRole = await UserService.getUserRole(session.user.id);

      if (userRole !== "admin") {
        return { success: false, error: "Unauthorized. Admin access required." };
      }
    }

    // Ensure targetUserId is defined before calling getUserActivityLogs
    if (!targetUserId) {
      return { success: false, error: "User ID is required" };
    }

    // Highlight: Call getUserActivityLogs to get the raw logs
    const result = await getUserActivityLogs(targetUserId, limit);

    if (result.success && result.logs) {
      // Highlight: Enrich the fetched logs with user data
      const enrichedLogs = await enrichActivityLogs(result.logs);
      return { success: true, logs: enrichedLogs };
    } else {
      return { success: false, error: result.error || "Failed to fetch user activity logs" };
    }
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error fetching user activity logs";
    return { success: false, error: message };
  }
}

// Alias for backward compatibility
