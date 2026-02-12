// src/actions/data-privacy/export.ts
"use server";

import { adminDataPrivacyService } from "@/lib/services/admin-data-privacy-service";
import { adminOrderService } from "@/lib/services/admin-order-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logActivity } from "@/firebase/actions";

function normalizeFormat(raw: unknown): "json" | "csv" {
  const v = typeof raw === "string" ? raw.toLowerCase().trim() : "";
  return v === "csv" ? "csv" : "json";
}

export async function exportUserData(_prevState: unknown, formData: FormData) {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false as const, error: "Not authenticated" };
    }

    const userId = session.user.id;
    const format = normalizeFormat(formData.get("format"));

    // ✅ Get profile/likes/activity via service
    const exportRes = await adminDataPrivacyService.exportUserData(userId);
    if (!exportRes.success) {
      return { success: false as const, error: exportRes.error };
    }

    const { user, likes, activity } = exportRes.data;

    if (!user) {
      return { success: false as const, error: "User data not found" };
    }

    // ✅ Get orders via service (best-effort)
    const ordersResult = await adminOrderService.getUserOrders(userId);
    const orders = ordersResult.success ? ordersResult.data : [];

    const exportData = {
      profile: {
        ...user,
        id: userId
      },
      orders,
      likes,
      activity
    };

    // Generate file content
    let fileContent: string;
    let contentType: string;
    let fileExtension: string;

    if (format === "json") {
      fileContent = JSON.stringify(exportData, null, 2);
      contentType = "application/json";
      fileExtension = "json";
    } else {
      // Simple CSV conversion for profile data only (as before)
      const csvData = Object.entries(exportData.profile)
        .map(([key, value]) => `${key},${JSON.stringify(value)}`)
        .join("\n");

      fileContent = `key,value\n${csvData}`;
      contentType = "text/csv";
      fileExtension = "csv";
    }

    // ✅ Store file in Firebase Storage + signed URL via service
    const fileRes = await adminDataPrivacyService.createSignedExportFile({
      userId,
      fileContent,
      contentType,
      fileExtension
    });

    if (!fileRes.success) {
      return { success: false as const, error: fileRes.error };
    }

    // Log activity (best-effort)
    try {
      await logActivity({
        userId,
        type: "data-export",
        description: "User data exported",
        status: "success",
        metadata: {
          format,
          includedOrders: orders.length,
          ordersFetchFailed: !ordersResult.success ? ordersResult.error : undefined
        }
      });
    } catch (e) {
      console.warn("exportUserData: logActivity failed:", e);
    }

    return {
      success: true as const,
      downloadUrl: fileRes.data.downloadUrl,
      message: `Your data has been exported in ${format.toUpperCase()} format`
    };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error exporting user data";

    console.error("Error exporting user data:", message);
    return { success: false as const, error: message };
  }
}
