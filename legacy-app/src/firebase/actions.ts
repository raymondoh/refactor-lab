// ===============================
// 📂 src/firebase/actions.ts
// ===============================
"use server";

import { adminActivityService } from "@/lib/services/admin-activity-service";

export async function logActivity(input: {
  userId: string;
  type: string;
  description: string;
  status?: "success" | "error" | "warning" | "info";
  metadata?: Record<string, unknown>;
}) {
  const result = await adminActivityService.logActivity(input);

  if (!result.ok) {
    console.error("[logActivity] Error:", result.error);
    return { success: false as const, error: result.error };
  }

  return { success: true as const, id: result.data.id };
}
