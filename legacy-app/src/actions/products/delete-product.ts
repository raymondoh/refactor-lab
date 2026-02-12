// src/actions/products/delete-product.ts
"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/actions/_helpers/require-admin";
import { adminProductService } from "@/lib/services/admin-product-service";
import { adminActivityService } from "@/lib/services/admin-activity-service";

import { deleteProductImages } from "@/lib/services/storage-service";
import { getProductImageRefs } from "@/utils/product-images";

import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

// Delete product (admin only)
export async function deleteProductAction(productId: string) {
  // 1) Admin gate (caller validation lives in actions, not services)
  const gate = await requireAdmin();
  if (!gate.success) {
    return { success: false as const, error: gate.error };
  }

  try {
    // 2) Fetch product first so we can delete images best-effort + log name
    const found = await adminProductService.getProductDoc(productId);
    if (!found.success) {
      // best-effort log
      try {
        await adminActivityService.logActivity({
          userId: gate.userId,
          type: "delete_product",
          description: "Failed to delete product (not found)",
          status: "error",
          metadata: { productId, error: found.error }
        });
      } catch {}

      return { success: false as const, error: found.error };
    }

    const product = found.data.product;
    const productName = product.name || "Unknown Product";

    // 3) Best-effort: delete associated storage objects (do not block product deletion)
    try {
      const refs = getProductImageRefs(product);
      const del = await deleteProductImages(refs);
      if (!del.success) {
        console.warn("deleteProductAction: image cleanup failed:", del.error);
      }
    } catch (e) {
      console.warn("deleteProductAction: image cleanup threw:", e);
    }

    // 4) Delete Firestore doc
    const result = await adminProductService.deleteProductDoc(productId);
    if (!result.success) {
      // best-effort log
      try {
        await adminActivityService.logActivity({
          userId: gate.userId,
          type: "delete_product",
          description: `Failed to delete product: ${productName}`,
          status: "error",
          metadata: { productId, error: result.error }
        });
      } catch {}

      return { success: false as const, error: result.error };
    }

    // 5) Log success (best-effort)
    try {
      await adminActivityService.logActivity({
        userId: gate.userId,
        type: "delete_product",
        description: `Deleted product: ${productName}`,
        status: "warning",
        metadata: { productId }
      });
    } catch {}

    // 6) Revalidate relevant paths
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);

    // Maintain legacy return shape
    return { success: true as const };
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error deleting product";

    // best-effort log
    try {
      await adminActivityService.logActivity({
        userId: gate.userId,
        type: "delete_product",
        description: "Error deleting product",
        status: "error",
        metadata: { productId, error: message }
      });
    } catch {}

    return { success: false as const, error: message };
  }
}

// Export for backward compatibility
export { deleteProductAction as deleteProductFromDb };
export { deleteProductAction as deleteProduct };
