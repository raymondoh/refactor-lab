// ===============================
// 📂 src/lib/services/admin-product-service.ts
// Admin product service (Firestore only)
// NOTE: Admin gating + activity logging belong in actions.
// ===============================
import "server-only";

import type { DocumentData } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";

import { ok, fail, type ServiceResult } from "@/lib/services/service-result";
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { slugifyProductName } from "@/lib/urls/product-url";

import type { Product, ProductFilterOptions } from "@/types/product";
import { serializeProduct, serializeProductArray } from "@/utils/serializeProduct";
import { productSchema, productUpdateSchema } from "@/schemas/product";
import { normalizeCategory, normalizeSubcategory } from "@/config/categories";

// --------------------
// helpers (no any)
// --------------------
function asRecord(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? (v as unknown[]).map(x => String(x ?? "")).filter(Boolean) : [];
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" ? v : fallback;
}

function asBoolean(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

type CreatedAtSortable = { toMillis?: () => number };

function toMillisSafe(v: unknown): number {
  if (!v || typeof v !== "object") return 0;
  const m = (v as CreatedAtSortable).toMillis;
  return typeof m === "function" ? m.call(v) : 0;
}

function asTimestampOrString(v: unknown, fallback: Timestamp | string): Timestamp | string {
  if (v instanceof Timestamp) return v;
  if (typeof v === "string") return v;
  return fallback;
}

function asTimestampOrStringOptional(v: unknown): Timestamp | string | undefined {
  if (v instanceof Timestamp) return v;
  if (typeof v === "string") return v;
  return undefined;
}

function errMessage(error: unknown, fallback: string) {
  return isFirebaseError(error) ? firebaseError(error) : error instanceof Error ? error.message : fallback;
}

function mapDocToProduct(doc: FirebaseFirestore.DocumentSnapshot): Product {
  const data = asRecord(doc.data());

  const image = asString(data["image"], "/placeholder.svg");
  const additionalImages = Array.isArray(data["additionalImages"]) ? (data["additionalImages"] as unknown[]) : [];
  const additionalImagesStrings = additionalImages.map(x => asString(x)).filter(Boolean);

  const images =
    Array.isArray(data["images"]) && (data["images"] as unknown[]).length > 0
      ? (data["images"] as unknown[]).map(x => asString(x)).filter(Boolean)
      : image
        ? [image, ...additionalImagesStrings]
        : additionalImagesStrings;

  return {
    id: doc.id,
    slug: asString(data["slug"]),
    name: asString(data["name"]),
    description: asString(data["description"]),
    details: asString(data["details"]),
    sku: asString(data["sku"]),
    barcode: asString(data["barcode"]),
    category: asString(data["category"]),
    subcategory: asString(data["subcategory"]),
    designThemes: asStringArray(data["designThemes"]),
    productType: asString(data["productType"]),
    tags: asStringArray(data["tags"]),
    brand: asString(data["brand"]),
    manufacturer: asString(data["manufacturer"]),
    dimensions: asString(data["dimensions"]),
    weight: asString(data["weight"]),
    shippingWeight: asString(data["shippingWeight"]),
    material: asString(data["material"]),
    finish: typeof data["finish"] === "string" ? (data["finish"] as string) : undefined,
    color: asString(data["color"]),
    baseColor: asString(data["baseColor"]),
    colorDisplayName: asString(data["colorDisplayName"]),
    stickySide:
      data["stickySide"] === "Front" || data["stickySide"] === "Back" ? (data["stickySide"] as any) : undefined,
    size: asString(data["size"]),
    image,
    additionalImages: additionalImagesStrings,
    images,
    placements: asStringArray(data["placements"]),
    price: asNumber(data["price"], 0),
    salePrice: typeof data["salePrice"] === "number" ? (data["salePrice"] as number) : undefined,
    onSale: asBoolean(data["onSale"], false),
    costPrice: typeof data["costPrice"] === "number" ? (data["costPrice"] as number) : undefined,
    stockQuantity: typeof data["stockQuantity"] === "number" ? (data["stockQuantity"] as number) : undefined,
    lowStockThreshold:
      typeof data["lowStockThreshold"] === "number" ? (data["lowStockThreshold"] as number) : undefined,
    shippingClass: asString(data["shippingClass"]),
    inStock: typeof data["inStock"] === "boolean" ? (data["inStock"] as boolean) : true,
    badge: asString(data["badge"]),
    isFeatured: asBoolean(data["isFeatured"], false),
    isHero: asBoolean(data["isHero"], false),
    isLiked: asBoolean(data["isLiked"], false),
    isCustomizable: asBoolean(data["isCustomizable"], false),
    isNewArrival: asBoolean(data["isNewArrival"], false),
    createdAt: asTimestampOrString(data["createdAt"], Timestamp.now()),
    updatedAt: asTimestampOrStringOptional(data["updatedAt"]),
    averageRating: asNumber(data["averageRating"], 0),
    reviewCount: asNumber(data["reviewCount"], 0)
  };
}

export const adminProductService = {
  // ===================
  // LIST PRODUCTS
  // ===================
  async listProducts(
    filters?: ProductFilterOptions & { limit?: number }
  ): Promise<ServiceResult<ReturnType<typeof serializeProductArray>>> {
    // If any filters (including query) are provided, use filter path
    if (filters && Object.keys(filters).some(key => key !== "limit")) {
      return adminProductService.filterProducts(filters);
    }

    try {
      const db = getAdminFirestore();
      let q = db.collection("products").orderBy("createdAt", "desc");

      if (filters?.limit && typeof filters.limit === "number" && filters.limit > 0) {
        q = q.limit(filters.limit);
      }

      const snapshot = await q.get();
      const products = snapshot.docs.map(mapDocToProduct);

      return ok(serializeProductArray(products));
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error fetching products"), 500);
    }
  },

  // ===================
  // FILTER PRODUCTS
  // ===================
  async filterProducts(
    filters: ProductFilterOptions
  ): Promise<ServiceResult<ReturnType<typeof serializeProductArray>>> {
    try {
      // Normalize category/subcategory
      if (filters.category) {
        const normalizedCategory = normalizeCategory(filters.category);
        if (normalizedCategory) filters.category = normalizedCategory;
      }

      if (filters.subcategory && filters.category) {
        const normalizedCategory = normalizeCategory(filters.category);
        const normalizedSubcategory = normalizeSubcategory(filters.subcategory, normalizedCategory);
        if (normalizedSubcategory) filters.subcategory = normalizedSubcategory;
      }

      const db = getAdminFirestore();
      let q = db.collection("products").orderBy("createdAt", "desc");

      if (filters.category) q = q.where("category", "==", filters.category);
      if (filters.subcategory) q = q.where("subcategory", "==", filters.subcategory);
      if (filters.material) q = q.where("material", "==", filters.material);
      if (filters.finish) q = q.where("finish", "==", filters.finish);
      if (filters.productType) q = q.where("productType", "==", filters.productType);
      if (filters.stickySide) q = q.where("stickySide", "==", filters.stickySide);
      if (filters.brand) q = q.where("brand", "==", filters.brand);
      if (filters.baseColor) q = q.where("baseColor", "==", filters.baseColor);

      if (filters.isFeatured !== undefined) q = q.where("isFeatured", "==", filters.isFeatured);
      if (filters.isCustomizable !== undefined) q = q.where("isCustomizable", "==", filters.isCustomizable);
      if (filters.onSale !== undefined) q = q.where("onSale", "==", filters.onSale);
      if (filters.isNewArrival !== undefined) q = q.where("isNewArrival", "==", filters.isNewArrival);
      if (filters.inStock !== undefined) q = q.where("inStock", "==", filters.inStock);

      if (filters.priceRange) {
        const [minPriceStr, maxPriceStr] = filters.priceRange.split("-");
        const minPrice = Number.parseFloat(minPriceStr);
        const maxPrice = Number.parseFloat(maxPriceStr);

        if (!Number.isNaN(minPrice)) q = q.where("price", ">=", minPrice);
        if (!Number.isNaN(maxPrice)) q = q.where("price", "<=", maxPrice);
      }

      const snapshot = await q.get();
      let products = snapshot.docs.map(mapDocToProduct);

      // In-memory query filter
      if (filters.query) {
        const lower = filters.query.toLowerCase();
        products = products.filter(p => {
          const name = (p.name ?? "").toLowerCase().includes(lower);
          const desc = (p.description ?? "").toLowerCase().includes(lower);
          const tags = (p.tags ?? []).some(t =>
            String(t ?? "")
              .toLowerCase()
              .includes(lower)
          );
          return name || desc || tags;
        });
      }

      // In-memory array filters (case-insensitive)
      if (filters.designThemes && filters.designThemes.length > 0) {
        const wanted = new Set(filters.designThemes.map(t => t.toLowerCase()));
        products = products.filter(p => (p.designThemes || []).some(t => wanted.has(String(t).toLowerCase())));
      }

      if (filters.placements && filters.placements.length > 0) {
        const wanted = new Set(filters.placements.map(p => p.toLowerCase()));
        products = products.filter(p => (p.placements || []).some(pl => wanted.has(String(pl).toLowerCase())));
      }

      if (filters.tags && filters.tags.length > 0) {
        const wanted = new Set(filters.tags.map(t => t.toLowerCase()));
        products = products.filter(p => (p.tags || []).some(tag => wanted.has(String(tag).toLowerCase())));
      }

      return ok(serializeProductArray(products));
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error fetching filtered products"), 500);
    }
  },

  // ===================
  // LEGACY ALIASES
  // ===================
  async getAllProducts(
    filters?: ProductFilterOptions & { limit?: number }
  ): Promise<ServiceResult<ReturnType<typeof serializeProductArray>>> {
    return adminProductService.listProducts(filters);
  },

  async getFilteredProducts(
    filters: ProductFilterOptions
  ): Promise<ServiceResult<ReturnType<typeof serializeProductArray>>> {
    return adminProductService.filterProducts(filters);
  },

  async getFeaturedProducts(limit = 10): Promise<ServiceResult<ReturnType<typeof serializeProductArray>>> {
    try {
      const db = getAdminFirestore();

      try {
        const snap = await db
          .collection("products")
          .where("isFeatured", "==", true)
          .orderBy("createdAt", "desc")
          .limit(limit)
          .get();

        const products = snap.docs.map(mapDocToProduct);
        return ok(serializeProductArray(products));
      } catch {
        // fallback: load more and filter in-memory
        const all = await adminProductService.listProducts({ limit: limit * 4 });
        if (!all.ok) return all;

        const featured = all.data.filter(p => p.isFeatured === true).slice(0, limit);
        return ok(serializeProductArray(featured as unknown as Product[]));
      }
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error fetching featured products"), 500);
    }
  },

  async getOnSaleProducts(limit = 10): Promise<ServiceResult<ReturnType<typeof serializeProductArray>>> {
    try {
      const db = getAdminFirestore();

      try {
        const snap = await db
          .collection("products")
          .where("onSale", "==", true)
          .orderBy("createdAt", "desc")
          .limit(limit)
          .get();

        const products = snap.docs.map(mapDocToProduct);
        return ok(serializeProductArray(products));
      } catch {
        const snap = await db.collection("products").where("onSale", "==", true).limit(limit).get();
        const products = snap.docs.map(mapDocToProduct);

        products.sort((a, b) => toMillisSafe(b.createdAt) - toMillisSafe(a.createdAt));
        return ok(serializeProductArray(products.slice(0, limit)));
      }
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error fetching sale products"), 500);
    }
  },

  async getNewArrivals(limit = 10): Promise<ServiceResult<ReturnType<typeof serializeProductArray>>> {
    const res = await adminProductService.filterProducts({ isNewArrival: true } as ProductFilterOptions);
    if (!res.ok) return res;

    const sliced = res.data.slice(0, limit);
    return ok(serializeProductArray(sliced as unknown as Product[]));
  },

  async getThemedProducts(limit = 6): Promise<ServiceResult<ReturnType<typeof serializeProductArray>>> {
    const res = await adminProductService.listProducts({ limit: limit * 4 });
    if (!res.ok) return res;

    const themed = res.data.filter(p => Array.isArray(p.designThemes) && p.designThemes.length > 0).slice(0, limit);

    return ok(serializeProductArray(themed as unknown as Product[]));
  },

  async getRelatedProducts(params: {
    productId: string;
    category?: string;
    subcategory?: string;
    designTheme?: string;
    productType?: string;
    brand?: string;
    tags?: string[];
    limit?: number;
  }): Promise<ServiceResult<ReturnType<typeof serializeProductArray>>> {
    const { productId, category, subcategory, designTheme, productType, brand, tags, limit = 4 } = params;

    try {
      const db = getAdminFirestore();
      let q = db.collection("products") as FirebaseFirestore.Query<DocumentData>;

      if (category) q = q.where("category", "==", category);
      if (subcategory) q = q.where("subcategory", "==", subcategory);
      if (productType) q = q.where("productType", "==", productType);
      if (brand) q = q.where("brand", "==", brand);

      const snapshot = await q
        .orderBy("createdAt", "desc")
        .limit(limit + 6)
        .get();

      let related = snapshot.docs.map(doc => mapDocToProduct(doc)).filter(p => p.id !== productId);

      if (designTheme) {
        const dt = designTheme.toLowerCase();
        related = related.filter(p => (p.designThemes || []).some(t => String(t).toLowerCase() === dt));
      }

      if (tags && tags.length > 0) {
        const wanted = new Set(tags.map(t => t.toLowerCase()));
        related = related.filter(p => (p.tags || []).some(tag => wanted.has(String(tag).toLowerCase())));
      }

      if (related.length === 0) {
        const fallback = await adminProductService.listProducts({ limit: limit + 6 });
        if (!fallback.ok) return fallback;

        const fb = fallback.data.filter(p => p.id !== productId).slice(0, limit);
        return ok(serializeProductArray(fb as unknown as Product[]));
      }

      return ok(serializeProductArray(related.slice(0, limit)));
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error fetching related products"), 500);
    }
  },

  // ===================
  // ADD PRODUCT
  // ===================
  async addProduct(data: unknown): Promise<ServiceResult<{ id: string; product: unknown }>> {
    try {
      const validationResult = productSchema.safeParse(data);
      if (!validationResult.success) {
        return fail("VALIDATION", "Validation failed", 400);
      }
      const validatedData = validationResult.data;

      // ✅ Ensure slug exists (prefer explicit slug, else derive from name)
      const slug = slugifyProductName((validatedData as any).slug || validatedData.name);

      const db = getAdminFirestore();

      const docRef = await db.collection("products").add({
        ...validatedData,
        slug,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const finalSku = validatedData.sku ?? `SKU-${docRef.id.substring(0, 8).toUpperCase()}`;
      if (!validatedData.sku) await docRef.update({ sku: finalSku });

      return ok({ id: docRef.id, product: { ...validatedData, sku: finalSku } });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error adding product"), 500);
    }
  },

  // ===================
  // GET PRODUCT BY ID
  // ===================
  async getProductById(id: string): Promise<ServiceResult<{ product: ReturnType<typeof serializeProduct> }>> {
    try {
      const db = getAdminFirestore();
      const doc = await db.collection("products").doc(id).get();

      if (!doc.exists) return fail("NOT_FOUND", "Product not found", 404);

      const product = mapDocToProduct(doc);
      return ok({ product: serializeProduct(product) });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error fetching product by ID"), 500);
    }
  },

  // ===================
  // UPDATE PRODUCT
  // ===================
  async updateProduct(id: string, data: unknown): Promise<ServiceResult<{ id: string }>> {
    try {
      if (!id) return fail("BAD_REQUEST", "Product ID is required", 400);

      const validationResult = productUpdateSchema.safeParse(data);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors
          .map((err: { path: (string | number)[]; message: string }) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");

        return fail("VALIDATION", `Validation failed: ${errorMessages}`, 400);
      }

      const validatedData = validationResult.data;

      // ✅ Slug logic for PATCH updates:
      // - If slug is provided, normalize it
      // - Else if name is provided, derive slug from name
      // - Else, leave slug untouched
      const patch = validatedData as { slug?: string | null; name?: string | null };
      const nextSlugSource =
        typeof patch.slug === "string" && patch.slug.trim().length > 0
          ? patch.slug
          : typeof patch.name === "string" && patch.name.trim().length > 0
            ? patch.name
            : null;

      const updateData: Record<string, unknown> = {
        ...validatedData,
        ...(nextSlugSource ? { slug: slugifyProductName(nextSlugSource) } : {}),
        updatedAt: new Date()
      };

      Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

      const db = getAdminFirestore();
      await db.collection("products").doc(id).update(updateData);

      return ok({ id });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error updating product"), 500);
    }
  },

  // ===================
  // DELETE PRODUCT helpers
  // ===================
  async getProductDoc(productId: string): Promise<ServiceResult<{ product: Product }>> {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection("products").doc(productId).get();

      if (!snap.exists) return fail("NOT_FOUND", "Product not found", 404);

      const product = mapDocToProduct(snap);
      return ok({ product });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error fetching product"), 500);
    }
  },

  async deleteProductDoc(productId: string): Promise<ServiceResult<Record<string, never>>> {
    try {
      const db = getAdminFirestore();
      const docRef = db.collection("products").doc(productId);
      const snap = await docRef.get();

      if (!snap.exists) return fail("NOT_FOUND", "Product not found", 404);

      await docRef.delete();
      return ok({});
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Unknown error deleting product"), 500);
    }
  }
};
