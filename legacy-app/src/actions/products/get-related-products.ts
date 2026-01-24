"use server";

import { getRelatedProducts } from "@/firebase/admin/products";
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
    const result = await getRelatedProducts(params);
    return result;
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error fetching related products";
    return { success: false, error: message };
  }
}

// Export for backward compatibility
export { getRelatedProductsAction as getRelatedProductsFromDb };
export { getRelatedProductsAction as getRelatedProducts };
