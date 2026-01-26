"use server";

import { adminOrderService } from "@/lib/services/admin-order-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import type { Order } from "@/types/order";

export async function updateOrderStatusAction(orderId: string, status: Order["status"]) {
  try {
    const result = await adminOrderService.updateOrderStatus(orderId, status);

    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    return { success: true as const };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error updating order status";
    return { success: false as const, error: message };
  }
}

// Backward compatibility exports
export { updateOrderStatusAction as updateOrderStatus };
