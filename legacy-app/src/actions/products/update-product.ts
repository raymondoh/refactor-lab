"use server";

import { updateProduct } from "@/firebase/admin/products";
import { revalidatePath } from "next/cache";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

// Update product (admin only)
export async function updateProductAction(id: string, data: any) {
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

    const result = await updateProduct(id, data);

    if (result.success) {
      // Revalidate relevant paths
      revalidatePath("/admin/products");
      revalidatePath("/products");
      revalidatePath(`/products/${id}`);
    }

    return result;
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error updating product";
    return { success: false, error: message };
  }
}

// Export for backward compatibility
export { updateProductAction as updateProductInDb };
export { updateProductAction as updateProduct };
