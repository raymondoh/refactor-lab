// src/actions/products/get-product.ts
"use server";

import { adminProductService } from "@/lib/services/admin-product-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

// Get product by ID
export async function getProductByIdAction(id: string) {
  try {
    const result = await adminProductService.getProductById(id);

    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    // Maintain legacy return shape: { success, product }
    return { success: true as const, product: result.data.product };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error fetching product";
    return { success: false as const, error: message };
  }
}

// Export for backward compatibility
export { getProductByIdAction as getProductByIdFromDb };
export { getProductByIdAction as getProductById };
