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

import { slugifyProductName } from "@/lib/urls/product-url"; // ✅ add this

type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

/**
 * Update product (admin only)
 * - If slug is provided: normalize it
 * - Else if name changed: regenerate slug from new name
 * - Else: keep existing slug (stable URLs)
 */
export const updateProductAction = validatedAdminAction(
  async (args: { id: string; data: ProductUpdateInput }, userId: string) => {
    const { id, data } = args;

    try {
      // 1) Fetch product for context + slug decisions
      const before = await adminProductService.getProductDoc(id);

      const beforeProduct = before.ok ? before.data?.product : null;
      const beforeName = beforeProduct?.name || "Unknown Product";
      const beforeSlug =
        typeof (beforeProduct as any)?.slug === "string" ? String((beforeProduct as any).slug) : undefined;

      // 2) Validate update payload (keeps action strict)
      const parsed = productUpdateSchema.safeParse(data);
      if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message ?? "Invalid product update data";
        return fail("VALIDATION", msg);
      }

      const input = parsed.data;

      // 3) Slug rules
      // - If admin explicitly provided slug: normalize and use it.
      // - Else if name changed: regenerate slug from new name.
      // - Else: do not touch slug.
      const nextData: ProductUpdateInput & { slug?: string } = { ...input };

      const hasExplicitSlug = typeof (input as any).slug === "string" && String((input as any).slug).trim().length > 0;

      const hasNameChange =
        typeof input.name === "string" &&
        input.name.trim().length > 0 &&
        input.name.trim() !== (beforeProduct?.name ?? "");

      if (hasExplicitSlug) {
        nextData.slug = slugifyProductName(String((input as any).slug));
      } else if (hasNameChange && typeof input.name === "string" && input.name.trim().length > 0) {
        nextData.slug = slugifyProductName(input.name);
      } else {
        // keep existing slug (no-op)
      }

      // 4) Run the update
      const result = await adminProductService.updateProduct(id, nextData);

      if (!result.ok) {
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

      // 5) Best-effort: log success (include slug change context)
      try {
        const afterSlug = nextData.slug ?? beforeSlug;
        await adminActivityService.logActivity({
          userId,
          type: "update_product",
          description: `Updated product: ${beforeName}`,
          status: "success",
          metadata: {
            productId: id,
            slug: afterSlug,
            slugChanged: Boolean(nextData.slug && nextData.slug !== beforeSlug)
          }
        });
      } catch {}

      // 6) Revalidate relevant paths
      // Revalidate both "old slug" and "new slug" canonical URLs if we can.
      const oldCanonical = beforeSlug ? `/products/${slugifyProductName(beforeSlug)}--${id}` : null;
      const newCanonical = nextData.slug ? `/products/${nextData.slug}--${id}` : null;

      revalidatePath("/admin/products");
      revalidatePath(`/admin/products/${id}`);

      // Legacy / id-only path (if anything still links to it)
      revalidatePath(`/products/${id}`);

      // Canonical slug paths
      if (oldCanonical) revalidatePath(oldCanonical);
      if (newCanonical) revalidatePath(newCanonical);

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
