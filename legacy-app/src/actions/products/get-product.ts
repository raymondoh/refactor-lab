"use server";

import { getProductById } from "@/firebase/admin/products";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

// Get product by ID
export async function getProductByIdAction(id: string) {
  try {
    const result = await getProductById(id);
    return result;
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error fetching product";
    return { success: false, error: message };
  }
}

// Export for backward compatibility
export { getProductByIdAction as getProductByIdFromDb };
export { getProductByIdAction as getProductById };
