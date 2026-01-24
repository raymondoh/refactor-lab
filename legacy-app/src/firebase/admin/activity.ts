import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { Timestamp } from "firebase-admin/firestore";

// Types
export interface ActivityLog {
  id: string;
  userId: string;
  type: string;
  description: string;
  status: "success" | "error" | "warning" | "info";
  timestamp: Date | Timestamp;
  metadata?: Record<string, any>;
}

// Helper function to map Firestore document to ActivityLog
function mapDocToActivityLog(doc: any): ActivityLog {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    userId: data.userId || "",
    type: data.type || "",
    description: data.description || "",
    status: data.status || "info",
    timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : data.timestamp || new Date(),
    metadata: data.metadata || {}
  };
}

// Get all activity logs
export async function getAllActivityLogs(limit = 100) {
  try {
    console.log("[getAllActivityLogs] Starting query");
    const db = getAdminFirestore();
    const snapshot = await db.collection("activity").orderBy("timestamp", "desc").limit(limit).get();

    const logs = snapshot.docs.map(mapDocToActivityLog);

    console.log(`[getAllActivityLogs] Logs fetched: ${logs.length}`);
    return { success: true, logs };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error fetching activity logs";
    console.error("[getAllActivityLogs] Error:", message);
    return { success: false, error: message };
  }
}

// Get activity logs for a specific user - FIXED parameter order
export async function getUserActivityLogs(userId: string, limit = 100) {
  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection("activity")
      .where("userId", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    const logs = snapshot.docs.map(mapDocToActivityLog);

    console.log(
      `[${new Date().toISOString()}] [INFO] [activity] Fetched ${logs.length} activity logs for userId: ${userId}`
    );
    return { success: true, logs };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error fetching user activity logs";
    console.error(
      `[${new Date().toISOString()}] [ERROR] [activity] Error fetching logs for userId ${userId}:`,
      message
    );
    return { success: false, error: message };
  }
}

// Log activity
export async function logActivity({
  userId,
  type,
  description,
  status = "info",
  metadata = {}
}: {
  userId: string;
  type: string;
  description: string;
  status?: "success" | "error" | "warning" | "info";
  metadata?: Record<string, any>;
}) {
  try {
    const db = getAdminFirestore();
    const activityRef = db.collection("activity").doc();

    await activityRef.set({
      userId,
      type,
      description,
      status,
      timestamp: new Date(),
      metadata
    });

    return { success: true, id: activityRef.id };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error logging activity";
    console.error("[logActivity] Error:", message);
    return { success: false, error: message };
  }
}
