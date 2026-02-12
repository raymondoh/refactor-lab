"use server";

import { adminOrderService } from "@/lib/services/admin-order-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

import { requireAdmin } from "@/actions/_helpers/require-admin";
import type { Order } from "@/types/order";

type ActionResult = { success: true } | { success: false; error: string; status?: number };

export async function updateOrderStatusAction(orderId: string, status: Order["status"]): Promise<ActionResult> {
  try {
    const gate = await requireAdmin();
    if (!gate.success) {
      return { success: false, error: gate.error, status: gate.status };
    }

    // ✅ services are session-agnostic; actions pass adminId explicitly
    const result = await adminOrderService.updateOrderStatus(orderId, gate.userId, status);
    if (!result.success) {
      return { success: false, error: result.error, status: result.status };
    }

    return { success: true };
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error updating order status";

    return { success: false, error: message, status: 500 };
  }
}

// Backward compatibility exports
export { updateOrderStatusAction as updateOrderStatus };
