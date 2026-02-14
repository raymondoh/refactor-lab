// src/actions/products/update-product.ts
"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { adminProductService } from "@/lib/services/admin-product-service";
import { adminActivityService } from "@/lib/services/admin-activity-service";

import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { productUpdateSchema } from "@/schemas/product";
import { validatedAdminAction } from "@/actions/_helpers/action-wrapper";
import { ok, fail } from "@/lib/services/service-result";

type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

/**
 * Update product (admin only)
 * Refactored to use the validatedAdminAction wrapper for consistent security and response shapes.
 */
export const updateProductAction = validatedAdminAction(
  async (args: { id: string; data: ProductUpdateInput }, userId: string) => {
    const { id, data } = args;

    try {
      // 1) Fetch product for better logging context
      const before = await adminProductService.getProductDoc(id);
      const beforeName = before.success && before.data?.product?.name ? before.data.product.name : "Unknown Product";

      // 2) Run the update
      const result = await adminProductService.updateProduct(id, data);

      if (!result.success) {
        // Best-effort: log failure
        try {
          await adminActivityService.logActivity({
            userId,
            type: "update_product",
            description: `Failed to update product: ${beforeName}`,
            status: "error",
            metadata: { productId: id, error: result.error }
          });
        } catch (logErr) {
          console.error("Activity logging failed:", logErr);
        }

        return fail("UNKNOWN", result.error || "Failed to update product in database");
      }

      // 3) Best-effort: log success
      try {
        await adminActivityService.logActivity({
          userId,
          type: "update_product",
          description: `Updated product: ${beforeName}`,
          status: "success",
          metadata: { productId: id }
        });
      } catch {}

      // 4) Revalidate relevant paths
      revalidatePath("/admin/products");
      revalidatePath(`/admin/products/${id}`);
      revalidatePath(`/products/${id}`);
      revalidatePath("/products");
      revalidatePath("/");

      return ok({ success: true });
    } catch (error: unknown) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error updating product";

      // Best-effort: log error
      try {
        await adminActivityService.logActivity({
          userId,
          type: "update_product",
          description: "Error updating product",
          status: "error",
          metadata: { productId: id, error: message }
        });
      } catch {}

      return fail("UNKNOWN", message);
    }
  }
);
