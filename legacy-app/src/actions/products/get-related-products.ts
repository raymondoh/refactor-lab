"use server";

import { adminProductService } from "@/lib/services/admin-product-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

// Get related products
export async function getRelatedProductsAction(params: {
  productId: string;
  category?: string;
  subcategory?: string;
  designTheme?: string;
  productType?: string;
  brand?: string;
  tags?: string[];
  limit?: number;
}) {
  try {
    const result = await adminProductService.getRelatedProducts(params);

    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    // Maintain legacy return shape: { success, products }
    return { success: true as const, products: result.data };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error fetching related products";
    return { success: false as const, error: message };
  }
}

// Export for backward compatibility
export { getRelatedProductsAction as getRelatedProductsFromDb };
export { getRelatedProductsAction as getRelatedProducts };
