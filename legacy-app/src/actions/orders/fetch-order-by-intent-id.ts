// src/actions/orders/fetch-order-by-payment-intent-id.ts
"use server";

import { adminOrderService } from "@/lib/services/admin-order-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

/**
 * Server Action to fetch an order by its Stripe Payment Intent ID.
 */
export async function fetchOrderByPaymentIntentId(paymentIntentId: string) {
  try {
    const result = await adminOrderService.getOrderByPaymentIntentId(paymentIntentId);

    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    return { success: true as const, order: result.data };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error fetching order by payment intent ID";
    return { success: false as const, error: message };
  }
}
