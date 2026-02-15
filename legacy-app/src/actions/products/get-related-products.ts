// src/actions/products/get-related-products.ts
"use server";

import { adminProductService } from "@/lib/services/admin-product-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { ok, fail } from "@/lib/services/service-result";

/**
 * Get related products (Public Action)
 * Refactored to return the standardized ServiceResult shape (ok/fail).
 */
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

    if (!result.ok) {
      return fail("NOT_FOUND", result.error || "Could not find related products");
    }

    // Standardized return: { ok: true, data: { products: [...] } }
    return ok({ products: result.data });
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error fetching related products";

    return fail("UNKNOWN", message);
  }
}

// Export for backward compatibility
export { getRelatedProductsAction as getRelatedProductsFromDb };
export { getRelatedProductsAction as getRelatedProducts };
