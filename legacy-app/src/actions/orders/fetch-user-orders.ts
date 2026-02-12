// src/actions/orders/fetch-user-orders.ts
"use server";

import { adminOrderService } from "@/lib/services/admin-order-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

export type FetchUserOrdersResult =
  | { success: true; data: unknown } // keep loose if your callers don’t need strict typing here
  | { success: false; error: string; status?: number };

export async function fetchUserOrders(userId: string): Promise<FetchUserOrdersResult> {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated", status: 401 };
    }

    if (!userId) {
      return { success: false, error: "User ID is required", status: 400 };
    }

    // ✅ owner access, OR admin override
    const isOwner = session.user.id === userId;
    const isAdmin = session.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return { success: false, error: "Forbidden", status: 403 };
    }

    const result = await adminOrderService.getUserOrders(userId);
    if (!result.success) {
      return { success: false, error: result.error, status: result.status };
    }

    return { success: true, data: result.data };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error fetching user orders";

    return { success: false, error: message, status: 500 };
  }
}
