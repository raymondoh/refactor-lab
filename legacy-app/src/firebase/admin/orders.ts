// ===============================
// 📂 src/firebase/admin/orders.ts
// Compatibility wrapper (calls canonical service)
// ===============================

import type { Order } from "@/types/order";
import type { OrderData } from "@/types/order";
import { adminOrderService } from "@/lib/services/admin-order-service";

// Keep signature similar to legacy usage:

export async function createOrder(orderData: OrderData) {
  const result = await adminOrderService.createOrder(orderData);
  if (!result.success) return { success: false as const, error: result.error };
  return { success: true as const, orderId: result.data.orderId };
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const result = await adminOrderService.getUserOrders(userId);
  if (!result.success) throw new Error(result.error);
  return result.data;
}

export async function getAllOrders(): Promise<Order[]> {
  const result = await adminOrderService.getAllOrders();
  if (!result.success) throw new Error(result.error);
  return result.data;
}

export async function getOrderByPaymentIntentId(paymentIntentId: string) {
  const result = await adminOrderService.getOrderByPaymentIntentId(paymentIntentId);
  if (!result.success) throw new Error(result.error);
  return result.data.order ?? null;
}

export async function getOrderById(id: string) {
  const result = await adminOrderService.getOrderById(id);
  if (!result.success) throw new Error(result.error);
  return result.data.order ?? null;
}

export async function updateOrderStatus(orderId: string, status: Order["status"]) {
  const result = await adminOrderService.updateOrderStatus(orderId, status);
  if (!result.success) return { success: false as const, error: result.error };
  return { success: true as const };
}
