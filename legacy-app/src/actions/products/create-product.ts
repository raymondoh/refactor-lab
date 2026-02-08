"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/actions/_helpers/require-admin";
import { adminProductService } from "@/lib/services/admin-product-service";
import { adminActivityService } from "@/lib/services/admin-activity-service";

import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { productSchema } from "@/schemas/product";
import type { z } from "zod";

type ProductCreateInput = z.infer<typeof productSchema>;

// Create product (admin only)
export async function createProductAction(data: ProductCreateInput) {
  const gate = await requireAdmin();
  if (!gate.success) {
    return { success: false as const, error: gate.error };
  }

  try {
    // Optional: validate here to keep the action strict (service also validates defensively)
    const parsed = productSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid product data";
      return { success: false as const, error: msg };
    }

    const result = await adminProductService.addProduct(parsed.data);
    if (!result.success) {
      // best-effort log
      try {
        await adminActivityService.logActivity({
          userId: gate.userId,
          type: "create_product",
          description: "Failed to create product",
          status: "error",
          metadata: { error: result.error }
        });
      } catch {}

      return { success: false as const, error: result.error };
    }

    const productId = result.data.id;

    // best-effort log
    try {
      const name = (parsed.data.name || "Unknown Product") as string;
      await adminActivityService.logActivity({
        userId: gate.userId,
        type: "create_product",
        description: `Created product: ${name}`,
        status: "success",
        metadata: { productId }
      });
    } catch {}

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");
    // if you have a product detail route by ID/slug, you can add it here later

    return { success: true as const, id: productId };
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error creating product";

    // best-effort log
    try {
      await adminActivityService.logActivity({
        userId: gate.userId,
        type: "create_product",
        description: "Error creating product",
        status: "error",
        metadata: { error: message }
      });
    } catch {}

    return { success: false as const, error: message };
  }
}

// Back-compat alias if older code expects `createProduct`
export { createProductAction as createProduct };
