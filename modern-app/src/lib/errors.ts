// src/lib/errors.ts

/**
 * Safely extract a human-readable message from an unknown error.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;

  if (typeof err === "object" && err !== null) {
    try {
      if ("message" in err) {
        return String(err.message);
      }
    } catch {
      // ignore
    }
  }

  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}
