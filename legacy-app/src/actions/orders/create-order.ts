// src/actions/orders/create-order.ts
"use server";

import { adminOrderService } from "@/lib/services/admin-order-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { requireAdmin } from "@/actions/_helpers/require-admin";
import type { OrderData } from "@/types/order";

export async function createOrder(orderData: OrderData) {
  try {
    const gate = await requireAdmin();
    if (!gate.success) return { success: false as const, error: gate.error, status: gate.status };

    const result = await adminOrderService.createOrder(orderData);

    if (!result.ok) {
      return { success: false as const, error: result.error };
    }

    // Maintain legacy return shape: { success, orderId }
    return { success: true as const, orderId: result.data.orderId };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error creating order";
    return { success: false as const, error: message };
  }
}

// Backward compat alias
export { createOrder as createOrderInDb };
