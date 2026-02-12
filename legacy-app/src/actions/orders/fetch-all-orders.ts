// src/actions/orders/fetch-all-orders.ts
"use server";

import { adminOrderService } from "@/lib/services/admin-order-service";
import { requireAdmin } from "@/actions/_helpers/require-admin";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

// Fetch all orders (admin only)
export async function fetchAllOrders() {
  try {
    const gate = await requireAdmin();
    if (!gate.success) return { success: false as const, error: gate.error, status: gate.status };

    const result = await adminOrderService.getAllOrders();

    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    return { success: true as const, orders: result.data };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error fetching all orders";
    return { success: false as const, error: message };
  }
}

// Export with the expected name for backward compatibility
