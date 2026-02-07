"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/actions/_helpers/require-admin";
import { adminProductService } from "@/lib/services/admin-product-service";
import { deleteProductImages } from "@/lib/services/storage-service";
import { getProductImageRefs } from "@/utils/product-images";

import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

// Delete product (admin only)
export async function deleteProductAction(productId: string) {
  try {
    // 1) Admin gate (caller validation lives in actions, not services)
    const gate = await requireAdmin();
    if (!gate.success) {
      return { success: false as const, error: gate.error };
    }

    // 2) Fetch product first so we can delete images best-effort
    const found = await adminProductService.getProductDoc(productId);
    if (!found.success) {
      return { success: false as const, error: found.error };
    }

    const product = found.data.product;

    // 3) Best-effort: delete associated storage objects (do not block product deletion)
    const refs = getProductImageRefs(product);
    const del = await deleteProductImages(refs);
    if (!del.success) {
      // keep going; we don't want orphaned docs OR blocked deletions
      console.warn("deleteProductAction: image cleanup failed:", del.error);
    }

    // 4) Delete Firestore doc
    const result = await adminProductService.deleteProductDoc(productId);
    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    // 5) Revalidate relevant paths
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);

    // Maintain legacy return shape
    return { success: true as const };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error deleting product";

    return { success: false as const, error: message };
  }
}

// Export for backward compatibility
export { deleteProductAction as deleteProductFromDb };
export { deleteProductAction as deleteProduct };
