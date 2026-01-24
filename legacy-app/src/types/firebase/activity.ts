import type { Timestamp } from "firebase-admin/firestore";

/**
 * Types of activities that can be logged
 */
export type ActivityType =
  | "login"
  | "logout"
  | "registration"
  | "password_reset"
  | "profile_update"
  | "email_verification"
  | "settings_change"
  // Additional types from firebase/activity.ts
  | "password_change"
  | "email_change"
  | "security_alert"
  | "device_authorized"
  | "data_export"
  | "deletion_request"
  | "deletion_completed"
  // Product-related activities
  | "create_product"
  | "update_product"
  | "delete_product";

/**
 * Status of an activity
 */
export type ActivityStatus =
  | "success"
  | "failure"
  // Additional statuses from firebase/activity.ts
  | "failed"
  | "warning"
  | "pending"
  | "completed";

export interface ActivityLogData {
  userId: string;
  userEmail?: string;
  type: ActivityType | string;
  description: string;
  status: string;
  timestamp: Timestamp | string | Date;
  ipAddress?: string;
  location?: string;
  device?: string;
  deviceType?: string;
  metadata?: Record<string, any>;
}

/**
 * Activity log data with ID
 */
export type ActivityLogWithId = ActivityLogData & {
  id: string;
  name?: string;
  image?: string | null;
};

export type ActivityLogWithExtras = ActivityLogWithId & {
  userEmail?: string;
};

export interface SerializedActivity {
  id: string;
  userId: string;
  userEmail?: string;
  name: string;
  image?: string | null;
  type: string;
  description: string;
  status: string;
  timestamp: string; // serialized to ISO string
  ipAddress?: string;
  location?: string;
  device?: string;
  deviceType?: string;
  metadata?: Record<string, any>;
}

/**
 * Result types for activity log operations
 */
export interface LogActivityResult {
  success: boolean;
  activityId?: string;
  error?: string;
}

export interface GetUserActivityLogsResult {
  success: boolean;
  activities?: ActivityLogWithId[];
  error?: string;
}
