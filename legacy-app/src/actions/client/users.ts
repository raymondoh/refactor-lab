// /actions/client/fetchAllUsersClient.ts

"use client";

import type { SerializedUser } from "@/types/models/user";

export async function fetchAllUsersClient(): Promise<SerializedUser[]> {
  try {
    const res = await fetch("/api/admin/users");
    const json = await res.json();
    console.log("[fetchAllUsersClient] Result!!!:", json); // ✅ Add this
    return json.users || [];
  } catch (error) {
    console.error("[fetchAllUsersClient] Error:", error);
    return [];
  }
}
