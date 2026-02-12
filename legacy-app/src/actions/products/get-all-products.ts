// src/actions/products/get-all-products.ts
"use server";

import { adminProductService } from "@/lib/services/admin-product-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { requireAdmin } from "@/actions/_helpers/require-admin";
import type { ProductFilterOptions } from "@/types/filters/product-filters";

// Get all products with optional filters (ADMIN)
export async function getAllProductsAction(filters?: ProductFilterOptions) {
  try {
    const gate = await requireAdmin();
    if (!gate.success) {
      return { success: false as const, error: gate.error };
    }

    const result = await adminProductService.getAllProducts(filters);

    // Maintain existing return shape expected by callers
    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    return { success: true as const, data: result.data };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error fetching products";

    return { success: false as const, error: message };
  }
}

// Backward compatibility exports
export { getAllProductsAction as getAllProductsFromDB };
export { getAllProductsAction as getAllProducts };
