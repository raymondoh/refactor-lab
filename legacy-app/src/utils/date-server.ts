//utils/date-server.ts
import { FieldValue, Timestamp as AdminTimestamp } from "firebase-admin/firestore";

export type SupportedServerDate = Date | string | number | AdminTimestamp | null | undefined;

function isAdminTimestamp(value: unknown): value is AdminTimestamp {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  );
}

function toDate(value: SupportedServerDate): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (isAdminTimestamp(value)) return value.toDate();
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return null;
}

export function parseServerDate(value: SupportedServerDate): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (isAdminTimestamp(value)) return value.toDate();
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export function formatDate(date: SupportedServerDate): string {
  const dateObj = toDate(date);
  if (!dateObj || isNaN(dateObj.getTime())) return "Invalid date";
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  if (diff < 60 * 1000) return "Just now";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} minutes ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} hours ago`;
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))} days ago`;
  return dateObj.toLocaleDateString();
}

export { toDate };

// Add this export so you can import serverTimestamp elsewhere:
export const serverTimestamp = FieldValue.serverTimestamp;
