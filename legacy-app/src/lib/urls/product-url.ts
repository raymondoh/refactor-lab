// src/lib/urls/product-url.ts
import type { Product, SerializedProduct } from "@/types/models/product";

/**
 * Converts string to SEO-friendly slug
 * Example: "BMW M4 Competition!" -> "bmw-m4-competition"
 */
export function slugifyProductName(name: string, maxLength = 80): string {
  const slug = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug.substring(0, maxLength).replace(/-+$/g, "");
}

/**
 * Returns canonical product slug
 */
export function getProductSlug(product: Pick<Product | SerializedProduct, "slug" | "name">): string {
  const base = product.slug && product.slug.trim().length > 0 ? product.slug : product.name;

  return slugifyProductName(base);
}

/**
 * Returns canonical product URL path
 * Example: /products/bmw-m4-sticker--abc123
 */
export function getProductHref(product: Pick<Product | SerializedProduct, "id" | "slug" | "name">): string {
  const slug = getProductSlug(product);
  return `/products/${slug}--${product.id}`;
}

/**
 * Extract ID from slugId param
 * Example: bmw-m4-sticker--abc123 -> abc123
 */
export function extractProductId(slugId: string): string {
  if (!slugId) return "";
  const parts = String(slugId).split("--");
  return parts[parts.length - 1] || "";
}
export function isCanonicalProductSlug(
  slugId: string,
  product: Pick<Product | SerializedProduct, "id" | "slug" | "name">
): boolean {
  const expected = getProductSlug(product);
  const actualSlug = slugId.split("--")[0];

  return expected === actualSlug;
}
