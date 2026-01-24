//src/actions/client/index.ts
"use client";

import type { Dashboard } from "@/types";

export async function clientFetchActivityLogs({
  limit = 10,
  startAfter,
  type
}: Dashboard.FetchActivityLogsParams): Promise<Dashboard.FetchActivityLogsResponse> {
  try {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (startAfter) params.set("startAfter", startAfter);
    if (type) params.set("type", type);

    const res = await fetch(`/api/activity-logs?${params.toString()}`);
    if (!res.ok) {
      return { success: false, error: "Failed to fetch logs" };
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("clientFetchActivityLogs error:", error);
    return { success: false, error: "Unexpected client error occurred." };
  }
}
