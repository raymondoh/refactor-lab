import { z } from "zod";

export const productSchema = z.object({
  /* Basic product information */
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
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

/* Types inferred from the main schema */
export type ProductInput = z.infer<typeof productSchema>;

/* ─────────── partial schema for PATCH-style updates ─────────── */
export const productUpdateSchema = productSchema.partial();
export type UpdateProductInput = z.infer<typeof productUpdateSchema>;

/* ──────────────────────────────────────────────────────────
   DEPRECATED ALIASES - Will be removed in future version
   Use the main exports above instead
   ────────────────────────────────────────────────────────── */
// @deprecated Use productSchema instead
// export const createProductSchema = productSchema

// @deprecated Use productUpdateSchema instead
// export const updateProductSchemaLegacy = productUpdateSchema

// @deprecated Use ProductInput instead
// export type ProductFormValues = ProductInput

// @deprecated Use ProductInput instead
// export type CreateProductInput = ProductInput

// @deprecated Use UpdateProductInput instead
// export type ProductUpdateValues = UpdateProductInput
