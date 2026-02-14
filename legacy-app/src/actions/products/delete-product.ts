// src/actions/products/delete-product.ts
"use server";

import { revalidatePath } from "next/cache";
import { adminProductService } from "@/lib/services/admin-product-service";
import { adminActivityService } from "@/lib/services/admin-activity-service";
import { deleteProductImages } from "@/lib/services/storage-service";
import { getProductImageRefs } from "@/utils/product-images";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { validatedAdminAction } from "@/actions/_helpers/action-wrapper";
import { ok, fail } from "@/lib/services/service-result";

/**
 * Refactored deleteProductAction using the validatedAdminAction wrapper.
 * The wrapper handles authentication and admin role checks automatically.
 */
export const deleteProductAction = validatedAdminAction(async (productId: string, userId: string) => {
  try {
    // 1) Fetch product first so we can delete images best-effort + log name
    const found = await adminProductService.getProductDoc(productId);

    if (!found.success) {
      // Best-effort log for missing product
      try {
        await adminActivityService.logActivity({
          userId,
          type: "delete_product",
          description: "Failed to delete product (not found)",
          status: "error",
          metadata: { productId, error: found.error }
        });
      } catch (logErr) {
        console.error("Activity logging failed:", logErr);
      }

      return fail("NOT_FOUND", found.error || "Product not found");
    }

    // Access the product data correctly from the service response
    const product = found.data.product;
    const productName = product.name || "Unknown Product";

    // 2) Best-effort: delete associated storage objects (do not block product deletion)
    try {
      const refs = getProductImageRefs(product);
      const del = await deleteProductImages(refs);
      if (!del.success) {
        console.warn("deleteProductAction: image cleanup failed:", del.error);
      }
    } catch (e) {
      console.warn("deleteProductAction: image cleanup threw:", e);
    }

    // 3) Delete Firestore doc
    const result = await adminProductService.deleteProductDoc(productId);

    if (!result.success) {
      // Best-effort log for failed deletion
      try {
        await adminActivityService.logActivity({
          userId,
          type: "delete_product",
          description: `Failed to delete product: ${productName}`,
          status: "error",
          metadata: { productId, error: result.error }
        });
      } catch {}

      return fail("UNKNOWN", result.error || "Failed to delete product doc");
    }

    // 4) Log success (best-effort)
    try {
      await adminActivityService.logActivity({
        userId,
        type: "delete_product",
        description: `Deleted product: ${productName}`,
        status: "warning",
        metadata: { productId }
      });
    } catch {}

    // 5) Revalidate relevant paths
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);

    return ok({ success: true });
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error deleting product";

    // Best-effort error log
    try {
      await adminActivityService.logActivity({
        userId,
        type: "delete_product",
        description: "Error deleting product",
        status: "error",
        metadata: { productId, error: message }
      });
    } catch {}

    return fail("UNKNOWN", message);
  }
});

// Export for backward compatibility
export { deleteProductAction as deleteProductFromDb };
export { deleteProductAction as deleteProduct };
