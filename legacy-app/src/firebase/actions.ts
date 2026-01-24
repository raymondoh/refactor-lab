// ===============================
// 📂 src/firebase/actions.ts
// ===============================

// This file should only contain server actions, not direct Firebase Admin imports
// We'll move the logActivity function to a server action

"use server";

import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

// Log activity function - server action
export async function logActivity({
  userId,
  type,
  description,
  status = "info",
  metadata = {}
}: {
  userId: string;
  type: string;
  description: string;
  status?: "success" | "error" | "warning" | "info";
  metadata?: Record<string, any>;
}) {
  try {
    const db = getAdminFirestore();
    const activityRef = db.collection("activity").doc();

    await activityRef.set({
      userId,
      type,
      description,
      status,
      timestamp: new Date(),
      metadata
    });

    return { success: true, id: activityRef.id };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error logging activity";
    console.error("[logActivity] Error:", message);
    return { success: false, error: message };
  }
}
