"use server";

import { getAllOrders } from "@/firebase/admin/orders";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

// Fetch all orders (admin only)
export async function fetchAllOrders() {
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

    const orders = await getAllOrders();
    return { success: true, orders };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error fetching orders";
    return { success: false, error: message };
  }
}

// Export with the expected name for backward compatibility
