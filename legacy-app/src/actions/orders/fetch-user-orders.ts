"use server";

import { getUserOrders } from "@/firebase/admin/orders";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

// Fetch orders for the current user
export async function fetchUserOrders() {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const orders = await getUserOrders(session.user.id);
    return { success: true, orders };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error fetching user orders";
    return { success: false, error: message };
  }
}

// Fetch orders for a specific user (admin only)
export async function fetchOrdersForUser(userId: string) {
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

    const orders = await getUserOrders(userId);
    return { success: true, orders };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error fetching user orders";
    return { success: false, error: message };
  }
}
