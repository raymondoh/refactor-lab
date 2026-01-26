"use server";

import { adminProductService } from "@/lib/services/admin-product-service";
import { revalidatePath } from "next/cache";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

// Delete product (admin only)
export async function deleteProductAction(productId: string) {
  try {
    const result = await adminProductService.deleteProduct(productId);

    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    // Revalidate relevant paths
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);

    // Maintain legacy return shape
    return { success: true as const };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error deleting product";
    return { success: false as const, error: message };
  }
}

// Export for backward compatibility
export { deleteProductAction as deleteProductFromDb };
export { deleteProductAction as deleteProduct };
