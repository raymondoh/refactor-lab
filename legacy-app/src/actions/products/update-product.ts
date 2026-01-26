"use server";

import { adminProductService } from "@/lib/services/admin-product-service";
import { revalidatePath } from "next/cache";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

// Update product (admin only)
export async function updateProductAction(id: string, data: any) {
  try {
    const result = await adminProductService.updateProduct(id, data);

    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    // Revalidate relevant paths
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${id}`);

    // Maintain legacy return shape: { success, data: id }
    return { success: true as const, data: result.data.id };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error updating product";
    return { success: false as const, error: message };
  }
}

// Export for backward compatibility
export { updateProductAction as updateProductInDb };
export { updateProductAction as updateProduct };
