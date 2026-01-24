"use server";

import { getAllProducts } from "@/firebase/admin/products";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import type { ProductFilterOptions } from "@/types/product";

// Get all products with optional filters
export async function getAllProductsAction(filters?: ProductFilterOptions) {
  try {
    const result = await getAllProducts(filters);
    return result;
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error fetching products";
    return { success: false, error: message };
  }
}

// Export for backward compatibility
export { getAllProductsAction as getAllProductsFromDB };
export { getAllProductsAction as getAllProducts };
