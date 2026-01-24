"use client";

import { fetchAllOrders } from "@/actions/orders";
import type { Order } from "@/types/order";

/**
 * Client-side function to fetch all orders (admin only)
 * This is a wrapper around the server action for client components
 */
export async function fetchAllOrdersClient(): Promise<Order[]> {
  try {
    const result = await fetchAllOrders();

    // Handle the server action response format
    if (result.success && result.orders) {
      return result.orders;
    } else {
      console.error("Error fetching orders:", result.error);
      throw new Error(result.error || "Failed to fetch orders");
    }
  } catch (error) {
    console.error("Error fetching all admin orders:", error);
    throw new Error("Failed to fetch admin orders.");
  }
}
