// src/lib/logger.ts
// Unified logger for server-side (Node.js) environment NOT FOR FRONTEND USAGE
import { NextResponse } from "next/server";
import { getErrorMessage } from "./errors";

export type LogLevel = "info" | "warn" | "error";

function baseLog(level: LogLevel, message: string, ...args: unknown[]) {
  const logFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;

  logFn(message, ...args);
}

/**
 * Unified API error logger + JSON error response creator
 */
function apiError(route: string, err: unknown, status = 500) {
  const message = getErrorMessage(err);

  // Structured log
  baseLog("error", `[api/${route}] ${message}`, {
    error: err
  });

  return NextResponse.json(
    {
      error: "Internal server error",
      message
    },
    { status }
  );
}

export const logger = {
  info: (message: string, ...args: unknown[]) => baseLog("info", message, ...args),
  warn: (message: string, ...args: unknown[]) => baseLog("warn", message, ...args),
  error: (message: string, ...args: unknown[]) => baseLog("error", message, ...args),

  // 🔥 new helper
  apiError
};
