// src/actions/products/get-all-products.ts
"use server";

import { adminProductService } from "@/lib/services/admin-product-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { validatedAdminAction } from "@/actions/_helpers/action-wrapper";
import { ok, fail } from "@/lib/services/service-result";
import type { ProductFilterOptions } from "@/types/filters/product-filters";

/**
 * Get all products with optional filters (ADMIN)
 * Refactored to use the validatedAdminAction wrapper for consistent security and response shapes.
 */
export const getAllProductsAction = validatedAdminAction(async (filters: ProductFilterOptions | undefined) => {
  try {
    const result = await adminProductService.getAllProducts(filters);

    if (!result.ok) {
      return fail("UNKNOWN", result.error || "Failed to fetch products from database");
    }

    // FIX: result.data is already SerializedProduct[], so we assign it directly to the key
    return ok({ products: result.data });
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error fetching products";

    return fail("UNKNOWN", message);
  }
});

// Backward compatibility exports
export { getAllProductsAction as getAllProductsFromDB };
export { getAllProductsAction as getAllProducts };
