type FirestoreTimestampLike = { toDate: () => Date };

function isFirestoreTimestampLike(value: unknown): value is FirestoreTimestampLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  );
}

/**
 * Converts unknown date-ish input into Date | null.
 * Supports:
 * - Date
 * - Firestore Timestamp (toDate)
 * - ISO strings
 * - numbers (ms since epoch)
 * - numbers (seconds since epoch) if it looks like seconds
 */
export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (isFirestoreTimestampLike(value)) return value.toDate();

  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "number") {
    // Optional: handle seconds vs millis safely
    // If it's 10 digits-ish, treat as seconds
    const ms = value < 10_000_000_000 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}
