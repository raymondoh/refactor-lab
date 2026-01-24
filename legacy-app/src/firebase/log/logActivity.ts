// src/firebase/log/logActivity.ts
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { serverTimestamp } from "@/firebase/admin/firestore";
import type { ActivityLogInput } from "@/types/dashboard/activity";

export async function logActivity(input: ActivityLogInput) {
  await getAdminFirestore()
    .collection("activityLogs")
    .add({
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
}
