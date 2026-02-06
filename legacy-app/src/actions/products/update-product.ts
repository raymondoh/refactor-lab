"use server";

import { adminProductService } from "@/lib/services/admin-product-service";
import { revalidatePath } from "next/cache";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { productUpdateSchema } from "@/schemas/product";
import type { z } from "zod";

type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

// Update product (admin only)
export async function updateProductAction(id: string, data: ProductUpdateInput) {
  try {
    const result = await adminProductService.updateProduct(id, data);

    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath(`/products/${id}`);
    revalidatePath("/products");
    revalidatePath("/");

    return { success: true as const };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error updating product";

    return { success: false as const, error: message };
  }
}
