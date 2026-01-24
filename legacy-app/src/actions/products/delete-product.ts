"use server";

import { deleteProduct } from "@/firebase/admin/products";
import { revalidatePath } from "next/cache";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

// Delete product (admin only)
export async function deleteProductAction(productId: string) {
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

    const result = await deleteProduct(productId);

    if (result.success) {
      // Revalidate relevant paths
      revalidatePath("/admin/products");
      revalidatePath("/products");
      revalidatePath(`/products/${productId}`);
    }

    return result;
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error deleting product";
    return { success: false, error: message };
  }
}

// Export for backward compatibility
export { deleteProductAction as deleteProductFromDb };
export { deleteProductAction as deleteProduct };
