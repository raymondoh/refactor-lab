"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { requireAdmin } from "@/actions/_helpers/require-admin";
import { adminProductService } from "@/lib/services/admin-product-service";
import { adminActivityService } from "@/lib/services/admin-activity-service";

import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { productUpdateSchema } from "@/schemas/product";

type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

// Update product (admin only)
export async function updateProductAction(id: string, data: ProductUpdateInput) {
  const gate = await requireAdmin();
  if (!gate.success) {
    return { success: false as const, error: gate.error };
  }

  try {
    // Optional: fetch product for better logging context
    const before = await adminProductService.getProductDoc(id);
    const beforeName = before.success && before.data?.product?.name ? before.data.product.name : "Unknown Product";

    const result = await adminProductService.updateProduct(id, data);

    if (!result.success) {
      // Best-effort: log failure
      try {
        await adminActivityService.logActivity({
          userId: gate.userId,
          type: "update_product",
          description: `Failed to update product: ${beforeName}`,
          status: "error",
          metadata: { productId: id, error: result.error }
        });
      } catch {}

      return { success: false as const, error: result.error };
    }

    // Best-effort: log success
    try {
      await adminActivityService.logActivity({
        userId: gate.userId,
        type: "update_product",
        description: `Updated product: ${beforeName}`,
        status: "success",
        metadata: { productId: id }
      });
    } catch {}

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath(`/products/${id}`);
    revalidatePath("/products");
    revalidatePath("/");

    return { success: true as const };
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error updating product";

    // Best-effort: log error
    try {
      await adminActivityService.logActivity({
        userId: gate.userId,
        type: "update_product",
        description: "Error updating product",
        status: "error",
        metadata: { productId: id, error: message }
      });
    } catch {}

    return { success: false as const, error: message };
  }
}
