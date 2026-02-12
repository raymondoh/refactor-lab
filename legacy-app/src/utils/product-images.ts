import type { Product } from "@/types/models/product";

/** Returns a deduped list of product image refs (URLs or storage paths). */
export function getProductImageRefs(product: Product): string[] {
  const refs = [product.image, ...(product.additionalImages ?? []), ...(product.images ?? [])]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map(s => s.trim());

  return Array.from(new Set(refs));
}
