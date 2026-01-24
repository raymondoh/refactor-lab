"use server";

import { updateOrderStatus } from "@/firebase/admin/orders";
import { revalidatePath } from "next/cache";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import type { Order } from "@/types/order";

// Update order status (admin only)
export async function updateOrderStatusAction(orderId: string, status: Order["status"]) {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user is admin
    const { UserService } = await import("@/lib/services/user-service");
    const userRole = await UserService.getUserRole(session.user.id);

    if (userRole !== "admin") {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    const result = await updateOrderStatus(orderId, status);

    if (result.success) {
      // Revalidate relevant paths
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderId}`);
    }

    return result;
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error updating order status";
    return { success: false, error: message };
  }
}

// Export for backward compatibility
export { updateOrderStatusAction as updateOrderStatus };
