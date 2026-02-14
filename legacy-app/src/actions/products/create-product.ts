// src/actions/products/create-product.ts
"use server";

import { revalidatePath } from "next/cache";
import { adminProductService } from "@/lib/services/admin-product-service";
import { adminActivityService } from "@/lib/services/admin-activity-service";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { productSchema } from "@/schemas/product";
import { validatedAdminAction } from "@/actions/_helpers/action-wrapper";
import { ok, fail } from "@/lib/services/service-result";
import type { z } from "zod";

type ProductCreateInput = z.infer<typeof productSchema>;

/**
 * Refactored createProductAction using the validatedAdminAction wrapper.
 * The wrapper automatically handles authentication and admin role checks.
 */
export const createProductAction = validatedAdminAction(async (data: ProductCreateInput, userId: string) => {
  try {
    // 1) Validation (keeps the action strict)
    const parsed = productSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid product data";
      return fail("VALIDATION", msg);
    }

    // 2) Run the addition
    const result = await adminProductService.addProduct(parsed.data);

    if (!result.success) {
      // Best-effort log for failure
      try {
        await adminActivityService.logActivity({
          userId,
          type: "create_product",
          description: "Failed to create product",
          status: "error",
          metadata: { error: result.error }
        });
      } catch (logErr) {
        console.error("Activity logging failed:", logErr);
      }

      return fail("UNKNOWN", result.error || "Failed to add product to database");
    }

    const productId = result.data.id;
    const productName = (parsed.data.name || "Unknown Product") as string;

    // 3) Log success (best-effort)
    try {
      await adminActivityService.logActivity({
        userId,
        type: "create_product",
        description: `Created product: ${productName}`,
        status: "success",
        metadata: { productId }
      });
    } catch {}

    // 4) Revalidate relevant paths
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");

    return ok({ id: productId });
  } catch (error: unknown) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error creating product";

    // Best-effort error log
    try {
      await adminActivityService.logActivity({
        userId,
        type: "create_product",
        description: "Error creating product",
        status: "error",
        metadata: { error: message }
      });
    } catch {}

    return fail("UNKNOWN", message);
  }
});

// Back-compat alias if older code expects `createProduct`
export { createProductAction as createProduct };
