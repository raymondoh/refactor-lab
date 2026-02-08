// src/actions/orders/fetch-user-orders.ts
"use server";

import { adminOrderService } from "@/lib/services/admin-order-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { requireAdmin } from "@/actions/_helpers/require-admin";

export async function fetchUserOrders(userId: string) {
  try {
    const gate = await requireAdmin();
    if (!gate.success) return { success: false as const, error: gate.error, status: gate.status };

    const result = await adminOrderService.getUserOrders(userId);

    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    return { success: true as const, data: result.data };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error fetching user orders";
    return { success: false as const, error: message };
  }
}
