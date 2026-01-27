// src/lib/services/admin-activity-service.ts
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { Timestamp } from "firebase-admin/firestore";

type ServiceResponse<T> = { success: true; data: T } | { success: false; error: string; status?: number };

export interface ActivityLog {
  id: string;
  userId: string;
  type: string;
  description: string;
  status: "success" | "error" | "warning" | "info";
  timestamp: Date | Timestamp;
  metadata?: Record<string, any>;
}

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

export type LogActivityInput = {
  userId: string;
  type: string;
  description: string;
  status?: "success" | "error" | "warning" | "info";
  metadata?: Record<string, any>;
};

export const adminActivityService = {
  async logActivity(input: LogActivityInput): Promise<ServiceResponse<{ id: string }>> {
    try {
      const db = getAdminFirestore();
      const ref = db.collection("activity").doc();

      await ref.set({
        userId: input.userId,
        type: input.type,
        description: input.description,
        status: input.status ?? "info",
        timestamp: new Date(),
        metadata: input.metadata ?? {}
      });

      return { success: true, data: { id: ref.id } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error logging activity";
      return { success: false, error: message, status: 500 };
    }
  },

  async getAllActivityLogs(limit = 100): Promise<ServiceResponse<{ logs: ActivityLog[] }>> {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection("activity").orderBy("timestamp", "desc").limit(limit).get();
      return { success: true, data: { logs: snap.docs.map(mapDocToActivityLog) } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error fetching activity logs";
      return { success: false, error: message, status: 500 };
    }
  },

  async getUserActivityLogs(userId: string, limit = 100): Promise<ServiceResponse<{ logs: ActivityLog[] }>> {
    try {
      const db = getAdminFirestore();
      const snap = await db
        .collection("activity")
        .where("userId", "==", userId)
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get();

      return { success: true, data: { logs: snap.docs.map(mapDocToActivityLog) } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error fetching user activity logs";
      return { success: false, error: message, status: 500 };
    }
  },

  async countAll(): Promise<ServiceResponse<{ total: number }>> {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection("activity").count().get();
      return { success: true, data: { total: snap.data().count } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error counting activity logs";
      return { success: false, error: message, status: 500 };
    }
  }
};
