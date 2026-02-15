// src/schemas/product/product.ts
import { z } from "zod";
import { slugifyProductName } from "@/lib/urls/product-url";

/**
 * 1) Base object schema (must remain a ZodObject so .partial() works)
 */
export const productBaseSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug cannot be empty")
    .optional()
    .nullable()
    .transform(v => (typeof v === "string" && v.trim().length ? v.trim() : undefined)),

  /* Basic product information */
  name: z.string().min(3, "Product name must be at least 3 characters"),

  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be a positive number"),
  salePrice: z.coerce.number().positive("Sale price must be a positive number").optional().nullable(),

  /* Inventory information */
  sku: z.string().optional(),
  stockQuantity: z.coerce.number().int().nonnegative("Stock quantity must be a non-negative integer").optional(),

  /* Product categorisation */
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  designThemes: z.array(z.string()).optional(),
  productType: z.string().optional(),

  /* Product specifications */
  material: z.string().optional(),
  brand: z.string().optional(),
  shippingClass: z.string().optional(),

  /* Metadata tags */
  tags: z.array(z.string()).optional(),

  /* Images */
  image: z.string().url("Image must be a valid URL").optional(),
  additionalImages: z.array(z.string().url("Must be a valid URL")).optional(),
  images: z.array(z.string().url("Must be a valid URL")).optional(),

  /* Status flags */
  isFeatured: z.boolean().default(false).optional(),
  isHero: z.boolean().default(false).optional(),
  isNewArrival: z.boolean().default(false).optional(),
  onSale: z.boolean().default(false).optional(),

  // Additional fields
  details: z.string().optional(),
  badge: z.string().optional(),
  dimensions: z.string().optional(),
  baseColor: z.string().optional(),
  colorDisplayName: z.string().optional(),
  color: z.string().optional(),
  stickySide: z.string().optional(),
  weight: z.string().optional(),
  shippingWeight: z.string().optional(),
  lowStockThreshold: z.coerce.number().int().nonnegative().optional(),
  inStock: z.boolean().default(true).optional()
});

/**
 * 2) Create schema (adds slug auto-generation)
 *    This keeps your current behavior: slug is always normalized on create.
 */
export const productSchema = productBaseSchema.transform(val => {
  const slugSource = val.slug?.trim() || val.name;
  return {
    ...val,
    slug: slugifyProductName(slugSource)
  };
});

/* Types inferred from the create schema */
export type ProductInput = z.infer<typeof productSchema>;

/**
 * 3) Update schema
 *    IMPORTANT: use base schema for partial() so it stays a ZodObject.
 *
 *    Note: this does NOT auto-generate slug (updates are partial by design).
 *    You can generate slug in the service/action if `name` or `slug` changes.
 */
export const productUpdateSchema = productBaseSchema.partial();
export type UpdateProductInput = z.infer<typeof productUpdateSchema>;
