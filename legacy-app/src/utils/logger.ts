// src/utils/logger.ts

import { logServerEvent } from "@/lib/services/logging-service";

// Re-export types for backward compatibility
export type { LogLevel, LogEntry } from "@/lib/services/logging-service";

// Base logger: always logs to console (client-safe)
export function logger({
  type,
  message,
  metadata,
  context = "general"
}: {
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
  context?: string;
}): void {
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
}

// Re-export the server logging function for backward compatibility
export { logServerEvent };
