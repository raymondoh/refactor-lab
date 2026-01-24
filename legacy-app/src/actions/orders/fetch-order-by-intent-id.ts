// src/actions/orders/fetch-order-by-payment-intent-id.ts
"use server";

import { getOrderByPaymentIntentId } from "@/firebase/admin/orders";
import type { Order } from "@/types/order";

/**
 * Server Action to fetch an order by its Stripe Payment Intent ID.
 */
export async function fetchOrderByPaymentIntentId(paymentIntentId: string): Promise<Order | null> {
  try {
    const order = await getOrderByPaymentIntentId(paymentIntentId);
    return order;
  } catch (error) {
    console.error("Failed to fetch order by payment intent ID in action:", error);
    return null; // Or throw a more specific error, depending on desired client-side handling
  }
}
