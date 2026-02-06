// ===============================
// 📂 src/lib/services/admin-product-service.ts
// Admin-only product service (Firestore + storage)
// ===============================

import type { DocumentData } from "firebase-admin/firestore";
import type { ServiceResponse } from "@/lib/services/types/service-response";

import { getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

import type { Product, ProductFilterOptions } from "@/types/product";
import type { User } from "@/types/user";

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

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"));
}

type CreatedAtSortable = { toMillis?: () => number };

function toMillisSafe(v: unknown): number {
  if (!v || typeof v !== "object") return 0;
  const m = (v as CreatedAtSortable).toMillis;
  return typeof m === "function" ? m.call(v) : 0;
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
    stickySide: typeof data["stickySide"] === "string" ? (data["stickySide"] as string) : undefined,
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
    createdAt: data["createdAt"],
    updatedAt: data["updatedAt"],
    averageRating: asNumber(data["averageRating"], 0),
    reviewCount: asNumber(data["reviewCount"], 0)
  };
}

/** Admin gate used by admin dashboard routes/actions */
async function requireAdmin(): Promise<ServiceResponse<{ userId: string }>> {
  const { auth } = await import("@/auth");
  const session = await auth();

  if (!session?.user?.id) return { success: false, error: "Not authenticated", status: 401 };

  const db = getAdminFirestore();
  const adminDoc = await db.collection("users").doc(session.user.id).get();
  const adminData = adminDoc.data() as Partial<User> | undefined;

  if (!adminData || adminData.role !== "admin") {
    return { success: false, error: "Unauthorized. Admin access required.", status: 403 };
  }

  return { success: true, data: { userId: session.user.id } };
}

/**
 * Tries to derive a bucket object path from:
 *  - https://storage.googleapis.com/<bucket>/<path>
 *  - https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>?alt=media
 * Returns null if it can't confidently parse.
 */
function storagePathFromUrl(imageUrl: string, bucketName: string): string | null {
  try {
    const url = new URL(imageUrl);

    // storage.googleapis.com/<bucket>/<path>
    if (url.hostname === "storage.googleapis.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && parts[0] === bucketName) {
        return parts.slice(1).join("/");
      }
    }

    // firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>
    if (url.hostname === "firebasestorage.googleapis.com") {
      const m = url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
      if (m && m[1] === bucketName) {
        return decodeURIComponent(m[2]);
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function deleteProductImage(imageUrl: string): Promise<ServiceResponse<Record<string, never>>> {
  try {
    const bucket = getAdminStorage().bucket();
    const bucketName = bucket.name;

    const storagePath = storagePathFromUrl(imageUrl, bucketName);
    if (!storagePath) {
      // Best-effort: don't fail deletion just because parsing failed
      return { success: true, data: {} };
    }

    await bucket.file(storagePath).delete({ ignoreNotFound: true });
    return { success: true, data: {} };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error deleting image";
    return { success: false, error: message, status: 500 };
  }
}

export const adminProductService = {
  // ===================
  // LIST PRODUCTS (ADMIN)  ✅ canonical
  // ===================
  async listProducts(
    filters?: ProductFilterOptions & { limit?: number }
  ): Promise<ServiceResponse<ReturnType<typeof serializeProductArray>>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

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
      return { success: true, data: serializeProductArray(products) };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error fetching products";
      return { success: false, error: message, status: 500 };
    }
  },

  // ===================
  // FILTER PRODUCTS (ADMIN) ✅ canonical
  // ===================
  async filterProducts(
    filters: ProductFilterOptions
  ): Promise<ServiceResponse<ReturnType<typeof serializeProductArray>>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

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

      // In-memory query filter (no any)
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

      return { success: true, data: serializeProductArray(products) };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error fetching filtered products";
      return { success: false, error: message, status: 500 };
    }
  },

  // ===================
  // LEGACY ALIASES ✅ (to stop TS errors across the app)
  // ===================
  async getAllProducts(
    filters?: ProductFilterOptions & { limit?: number }
  ): Promise<ServiceResponse<ReturnType<typeof serializeProductArray>>> {
    return adminProductService.listProducts(filters);
  },

  async getFilteredProducts(
    filters: ProductFilterOptions
  ): Promise<ServiceResponse<ReturnType<typeof serializeProductArray>>> {
    return adminProductService.filterProducts(filters);
  },

  async getFeaturedProducts(limit = 10): Promise<ServiceResponse<ReturnType<typeof serializeProductArray>>> {
    // Firestore filter + limit is safe; if index missing, fallback to in-memory
    try {
      const gate = await requireAdmin();
      if (!gate.success) return gate;

      const db = getAdminFirestore();
      try {
        const snap = await db
          .collection("products")
          .where("isFeatured", "==", true)
          .orderBy("createdAt", "desc")
          .limit(limit)
          .get();
        const products = snap.docs.map(mapDocToProduct);
        return { success: true, data: serializeProductArray(products) };
      } catch {
        const all = await adminProductService.listProducts({ limit: limit * 4 });
        if (!all.success) return all;

        // res.data is already serialized; keep it strongly typed
        const featured = all.data.filter(p => (p as Record<string, unknown>)["isFeatured"] === true).slice(0, limit);
        return { success: true, data: featured };
      }
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error fetching featured products";
      return { success: false, error: message, status: 500 };
    }
  },

  async getOnSaleProducts(limit = 10): Promise<ServiceResponse<ReturnType<typeof serializeProductArray>>> {
    try {
      const db = getAdminFirestore();

      // Primary attempt: fast + ordered
      try {
        const snap = await db
          .collection("products")
          .where("onSale", "==", true)
          .orderBy("createdAt", "desc")
          .limit(limit)
          .get();

        const products = snap.docs.map(mapDocToProduct);
        return { success: true, data: serializeProductArray(products) };
      } catch {
        // ✅ Safe fallback: still limited, no “fetch all”
        const snap = await db.collection("products").where("onSale", "==", true).limit(limit).get();
        const products = snap.docs.map(mapDocToProduct);

        // Optional: sort in-memory if createdAt exists (no any)
        products.sort((a, b) => toMillisSafe(b.createdAt) - toMillisSafe(a.createdAt));

        return { success: true, data: serializeProductArray(products.slice(0, limit)) };
      }
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error fetching sale products";
      return { success: false, error: message, status: 500 };
    }
  },

  async getNewArrivals(limit = 10): Promise<ServiceResponse<ReturnType<typeof serializeProductArray>>> {
    const res = await adminProductService.filterProducts({ isNewArrival: true } as ProductFilterOptions);
    if (!res.success) return res;

    // res.data is serialized array already
    return { success: true, data: res.data.slice(0, limit) };
  },

  async getThemedProducts(limit = 6): Promise<ServiceResponse<ReturnType<typeof serializeProductArray>>> {
    const res = await adminProductService.listProducts({ limit: limit * 4 });
    if (!res.success) return res;

    const themed = res.data
      .filter(p => {
        const rec = p as Record<string, unknown>;
        const dt = rec["designThemes"];
        return Array.isArray(dt) && dt.length > 0;
      })
      .slice(0, limit);

    return { success: true, data: themed };
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
  }): Promise<ServiceResponse<ReturnType<typeof serializeProductArray>>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

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
        if (!fallback.success) return fallback;

        const fb = fallback.data.filter(p => (p as Record<string, unknown>)["id"] !== productId).slice(0, limit);

        return { success: true, data: fb };
      }

      return { success: true, data: serializeProductArray(related.slice(0, limit)) };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error fetching related products";
      return { success: false, error: message, status: 500 };
    }
  },

  // ===================
  // ADD PRODUCT (ADMIN)
  // ===================
  async addProduct(data: unknown): Promise<ServiceResponse<{ id: string; product: unknown }>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    try {
      const validationResult = productSchema.safeParse(data);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors
          .map(err => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        return { success: false, error: `Validation failed: ${errorMessages}`, status: 400 };
      }

      const validatedData = validationResult.data;
      const now = new Date();

      const newProductData = {
        ...validatedData,
        createdAt: now,
        updatedAt: now
      };

      const db = getAdminFirestore();
      const docRef = await db.collection("products").add(newProductData);

      const finalSku = validatedData.sku ?? `SKU-${docRef.id.substring(0, 8).toUpperCase()}`;
      if (!validatedData.sku) await docRef.update({ sku: finalSku });

      const fullProduct = { id: docRef.id, ...validatedData, sku: finalSku, createdAt: now, updatedAt: now };
      return { success: true, data: { id: docRef.id, product: fullProduct } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error adding product";
      return { success: false, error: message, status: 500 };
    }
  },

  // ===================
  // GET PRODUCT BY ID (ADMIN)
  // ===================
  async getProductById(id: string): Promise<ServiceResponse<{ product: ReturnType<typeof serializeProduct> }>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    try {
      const db = getAdminFirestore();
      const doc = await db.collection("products").doc(id).get();

      if (!doc.exists) return { success: false, error: "Product not found", status: 404 };

      const product = mapDocToProduct(doc);
      return { success: true, data: { product: serializeProduct(product) } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error fetching product by ID";
      return { success: false, error: message, status: 500 };
    }
  },

  // ===================
  // UPDATE PRODUCT (ADMIN)
  // ===================
  async updateProduct(id: string, data: unknown): Promise<ServiceResponse<{ id: string }>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    try {
      if (!id) return { success: false, error: "Product ID is required", status: 400 };

      const validationResult = productUpdateSchema.safeParse(data);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors
          .map(err => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        return { success: false, error: `Validation failed: ${errorMessages}`, status: 400 };
      }

      const validatedData = validationResult.data;

      const updateData: Record<string, unknown> = { ...validatedData, updatedAt: new Date() };
      Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

      const db = getAdminFirestore();
      await db.collection("products").doc(id).update(updateData);

      return { success: true, data: { id } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error updating product";
      return { success: false, error: message, status: 500 };
    }
  },

  // ===================
  // DELETE PRODUCT (ADMIN)
  // ===================
  async deleteProduct(productId: string): Promise<ServiceResponse<Record<string, never>>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    try {
      const db = getAdminFirestore();
      const docRef = db.collection("products").doc(productId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) return { success: false, error: "Product not found", status: 404 };

      const data = asRecord(docSnap.data());
      const imageUrl = data["image"];
      const additionalImagesRaw = data["additionalImages"];
      const additionalImages = Array.isArray(additionalImagesRaw) ? additionalImagesRaw : [];

      await docRef.delete();

      // best-effort storage cleanup
      const urls: string[] = [];
      if (isHttpUrl(imageUrl)) urls.push(imageUrl);
      for (const u of additionalImages) if (isHttpUrl(u)) urls.push(u);

      await Promise.all(urls.map(u => deleteProductImage(u)));
      return { success: true, data: {} };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error deleting product";
      return { success: false, error: message, status: 500 };
    }
  }
};
