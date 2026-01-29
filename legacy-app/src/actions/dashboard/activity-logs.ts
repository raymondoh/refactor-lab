// src/actions/dashboard/activity-logs.ts
"use server";

import { adminActivityService, type ActivityLog } from "@/lib/services/admin-activity-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import type { SerializedActivity, ActivityLogWithId } from "@/types/firebase/activity";

// ✅ NEW: service-layer lookup (no direct users collection read here)
import { adminUserService } from "@/lib/services/admin-user-service";

type ActivityLogsResult = { success: true; logs: SerializedActivity[] } | { success: false; error: string };

/**
 * Helper function to enrich activity logs with user data (name, email, image).
 * Uses adminUserService.getUsersLookup() to avoid direct Firestore reads here.
 */
async function enrichActivityLogs(logs: ActivityLogWithId[]): Promise<SerializedActivity[]> {
  const usersResult = await adminUserService.getUsersLookup();
  if (!usersResult.success) {
    throw new Error(usersResult.error);
  }

  // FIX: Access the nested usersById property
  const usersLookup = usersResult.data.usersById;

  return logs.map(log => {
    const user = usersLookup[log.userId];
    // ... rest of function

    const userEmail = user?.email || log.userEmail;
    const name =
      user?.displayName ?? (user?.email ? user.email.split("@")[0] : (userEmail?.split("@")[0] ?? "Unknown User"));

    const image = user?.image || (log as any).image || null;

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

// Get all activity logs (admin only)
export async function fetchAllActivityLogs(limit = 100): Promise<ActivityLogsResult> {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const { UserService } = await import("@/lib/services/user-service");
    const userRole = await UserService.getUserRole(session.user.id);

    if (userRole !== "admin") {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    const result = await adminActivityService.getAllActivityLogs(limit);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const enrichedLogs = await enrichActivityLogs(result.data.logs);
    return { success: true, logs: enrichedLogs };
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
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const targetUserId = userId || session.user.id;

    // If requesting another user's logs, check admin permission
    if (targetUserId !== session.user.id) {
      const { UserService } = await import("@/lib/services/user-service");
      const userRole = await UserService.getUserRole(session.user.id);

      if (userRole !== "admin") {
        return { success: false, error: "Unauthorized. Admin access required." };
      }
    }

    if (!targetUserId) {
      return { success: false, error: "User ID is required" };
    }

    const result = await adminActivityService.getUserActivityLogs(targetUserId, limit);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const enrichedLogs = await enrichActivityLogs(result.data.logs);
    return { success: true, logs: enrichedLogs };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error fetching user activity logs";
    return { success: false, error: message };
  }
}

// Alias for backward compatibility (keep if you have one)
