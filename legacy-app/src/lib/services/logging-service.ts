"use server";

import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { Timestamp } from "firebase-admin/firestore";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

export type LogLevel =
  | "info"
  | "warn"
  | "error"
  | "debug"
  | `auth:${string}`
  | `admin:${string}`
  | `deletion:${string}`
  | `data-privacy:${string}`
  | `order:${string}`
  | `stripe:${string}`;

export interface LogEntry<T extends Record<string, unknown> = Record<string, unknown>> {
  type: LogLevel;
  message: string;
  userId?: string;
  metadata?: T;
  context?: string; // e.g., "auth", "products"
}

// Firestore logger: logs to Firestore + console
export async function logServerEvent({
  type,
  message,
  userId,
  metadata = {},
  context = "general"
}: LogEntry): Promise<void> {
  try {
    const db = getAdminFirestore();
    const log = {
      type,
      message,
      context,
      userId: userId || null,
      metadata,
      timestamp: Timestamp.now() // Use Firestore Timestamp for server logs
    };

    await db.collection("serverLogs").add(log);

    // Also log to console for development/debugging
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${type.toUpperCase()}] [${context}] ${message}`;
    const hasMetadata = metadata && Object.keys(metadata).length > 0;

    switch (type) {
      case "error":
        if (hasMetadata) {
          console.error(formattedMessage, metadata);
        } else {
          console.error(formattedMessage);
        }
        break;
      case "warn":
        if (hasMetadata) {
          console.warn(formattedMessage, metadata);
        } else {
          console.warn(formattedMessage);
        }
        break;
      default:
        if (hasMetadata) {
          console.log(formattedMessage, metadata);
        } else {
          console.log(formattedMessage);
        }
        break;
    }
  } catch (error) {
    const errorMessage = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error occurred while logging to Firestore";

    console.error("[LOGGER_ERROR] Failed to write log to Firestore:", errorMessage);
    console.error("Original log data:", { type, message, context, userId, metadata });
  }
}
