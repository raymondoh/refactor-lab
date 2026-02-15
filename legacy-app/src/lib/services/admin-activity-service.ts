// src/lib/services/admin-activity-service.ts
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { Timestamp } from "firebase-admin/firestore";

import type { ServiceResult } from "@/lib/services/service-result";
import { ok, fail } from "@/lib/services/service-result";

/**
 * For metadata, use unknown (not any). This keeps it flexible but type-safe.
 */
export type ActivityMetadata = Record<string, unknown>;

export interface ActivityLog {
  id: string;
  userId: string;
  type: string;
  description: string;
  status: "success" | "error" | "warning" | "info";
  timestamp: Date | Timestamp;
  metadata?: ActivityMetadata;
}

type ActivityLogDoc = {
  userId?: unknown;
  type?: unknown;
  description?: unknown;
  status?: unknown;
  timestamp?: unknown;
  metadata?: unknown;
};

function asActivityLogDoc(data: unknown): ActivityLogDoc {
  return data && typeof data === "object" ? (data as ActivityLogDoc) : {};
}

function toStatus(value: unknown): ActivityLog["status"] {
  return value === "success" || value === "error" || value === "warning" || value === "info" ? value : "info";
}

function toTimestamp(value: unknown): Date | Timestamp {
  if (value instanceof Timestamp) return value;
  if (value instanceof Date) return value;
  return new Date();
}

function toMetadata(value: unknown): ActivityMetadata | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as ActivityMetadata;
}

function mapDocToActivityLog(doc: FirebaseFirestore.QueryDocumentSnapshot): ActivityLog {
  const raw = doc.data();
  const data = asActivityLogDoc(raw);

  return {
    id: doc.id,
    userId: typeof data.userId === "string" ? data.userId : "",
    type: typeof data.type === "string" ? data.type : "",
    description: typeof data.description === "string" ? data.description : "",
    status: toStatus(data.status),
    timestamp: toTimestamp(data.timestamp),
    metadata: toMetadata(data.metadata)
  };
}

function errMessage(error: unknown, fallback: string) {
  return isFirebaseError(error) ? firebaseError(error) : error instanceof Error ? error.message : fallback;
}

function clampLimit(limit: number, fallback = 100) {
  if (!Number.isFinite(limit)) return fallback;
  return Math.max(1, Math.min(500, Math.floor(limit)));
}

export type LogActivityInput = {
  userId: string;
  type: string;
  description: string;
  status?: ActivityLog["status"];
  metadata?: ActivityMetadata;
};

export const adminActivityService = {
  async logActivity(input: LogActivityInput): Promise<ServiceResult<{ id: string }>> {
    if (!input?.userId) return fail("VALIDATION", "User ID is required", 400);
    if (!input?.type) return fail("VALIDATION", "Activity type is required", 400);
    if (!input?.description) return fail("VALIDATION", "Activity description is required", 400);

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

      return ok({ id: ref.id });
    } catch (error) {
      return fail("UNKNOWN", errMessage(error, "Unknown error logging activity"), 500);
    }
  },

  async getAllActivityLogs(limit = 100): Promise<ServiceResult<{ logs: ActivityLog[] }>> {
    const safeLimit = clampLimit(limit, 100);

    try {
      const db = getAdminFirestore();
      const snap = await db.collection("activity").orderBy("timestamp", "desc").limit(safeLimit).get();

      return ok({ logs: snap.docs.map(mapDocToActivityLog) });
    } catch (error) {
      return fail("UNKNOWN", errMessage(error, "Unknown error fetching activity logs"), 500);
    }
  },

  async getUserActivityLogs(userId: string, limit = 100): Promise<ServiceResult<{ logs: ActivityLog[] }>> {
    if (!userId) return fail("VALIDATION", "User ID is required", 400);
    const safeLimit = clampLimit(limit, 100);

    try {
      const db = getAdminFirestore();
      const snap = await db
        .collection("activity")
        .where("userId", "==", userId)
        .orderBy("timestamp", "desc")
        .limit(safeLimit)
        .get();

      return ok({ logs: snap.docs.map(mapDocToActivityLog) });
    } catch (error) {
      return fail("UNKNOWN", errMessage(error, "Unknown error fetching user activity logs"), 500);
    }
  },

  async countAll(): Promise<ServiceResult<{ total: number }>> {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection("activity").count().get();
      return ok({ total: snap.data().count });
    } catch (error) {
      return fail("UNKNOWN", errMessage(error, "Unknown error counting activity logs"), 500);
    }
  }
};
