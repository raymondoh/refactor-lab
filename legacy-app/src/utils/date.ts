// utils/date.ts
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function formatDate(date: string | Date | number | undefined, options?: { relative?: boolean }): string {
  if (!date) return "Unknown";

  const parsed = dayjs(date);
  if (!parsed.isValid()) return "Invalid date";

  if (options?.relative) {
    return parsed.fromNow(); // e.g. "3 days ago"
  }

  return parsed.format("MMM D, YYYY"); // e.g. "Apr 13, 2025"
}
