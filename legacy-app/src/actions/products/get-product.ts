// src/actions/products/get-product.ts
"use server";

import { adminProductService } from "@/lib/services/admin-product-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { validatedAdminAction } from "@/actions/_helpers/action-wrapper";
import { ok, fail } from "@/lib/services/service-result";

/**
 * Get product by ID (ADMIN)
 * Refactored to use the validatedAdminAction wrapper for consistent security and response shapes.
 */
export const getProductByIdAction = validatedAdminAction(async (id: string) => {
  try {
    const result = await adminProductService.getProductById(id);

    if (!result.ok) {
      return fail("NOT_FOUND", result.error || "Product not found");
    }

    // Return the product using the standardized ok utility
    return ok({ product: result.data.product });
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error fetching product";

    return fail("UNKNOWN", message);
  }
});
// ADD THIS: A public version for the storefront
export const getPublicProductById = async (id: string) => {
  try {
    // Calling the service directly, bypassing the admin-only wrapper
    const result = await adminProductService.getProductById(id);

    if (!result.ok) {
      return fail("NOT_FOUND", result.error || "Product not found");
    }

    return ok({ product: result.data.product });
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error fetching product";

    return fail("UNKNOWN", message);
  }
};

// Export for backward compatibility
export { getProductByIdAction as getProductByIdFromDb };
export { getProductByIdAction as getProductById };
