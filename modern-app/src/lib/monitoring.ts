import { logger } from "@/lib/logger";

export function captureException(error: Error, info?: unknown) {
  logger.error("Monitoring capture", error, info);
}
