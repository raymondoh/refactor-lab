// ===============================
// 📂 src/lib/services/admin-product-service.ts
// Canonical admin product service (Firestore + storage)
// ===============================

import { Timestamp } from "firebase-admin/firestore";
import type { DocumentData } from "firebase-admin/firestore";

import { getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

import type { Product, ProductFilterOptions } from "@/types/product";
import { serializeProduct, serializeProductArray } from "@/utils/serializeProduct";
import { productSchema, productUpdateSchema } from "@/schemas/product";
import { normalizeCategory, normalizeSubcategory } from "@/config/categories";

type ServiceResponse<T> = { success: true; data: T } | { success: false; error: string; status?: number };

function mapDocToProduct(doc: FirebaseFirestore.DocumentSnapshot): Product {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    name: data?.name || "",
    description: data?.description || "",
    details: data?.details || "",
    sku: data?.sku || "",
    barcode: data?.barcode || "",
    category: data.category || "",
    subcategory: data.subcategory || "",
    designThemes: data.designThemes || [],
    productType: data.productType || "",
    tags: data.tags || [],
    brand: data.brand || "",
    manufacturer: data?.manufacturer || "",
    dimensions: data?.dimensions || "",
    weight: data?.weight || "",
    shippingWeight: data?.shippingWeight || "",
    material: data?.material || "",
    finish: data?.finish || undefined,
    color: data?.color || "",
    baseColor: data?.baseColor || "",
    colorDisplayName: data?.colorDisplayName || "",
    stickySide: data?.stickySide || undefined,
    size: data?.size || "",
    image: data?.image || "/placeholder.svg",
    additionalImages: data?.additionalImages || [],
    images:
      data?.images || (data?.image ? [data.image, ...(data?.additionalImages || [])] : data?.additionalImages || []),
    placements: data?.placements || [],
    price: data?.price || 0,
    salePrice: data?.salePrice || undefined,
    onSale: data?.onSale || false,
    costPrice: data?.costPrice || undefined,
    stockQuantity: data?.stockQuantity || undefined,
    lowStockThreshold: data?.lowStockThreshold || undefined,
    shippingClass: data?.shippingClass || "",
    inStock: data?.inStock ?? true,
    badge: data?.badge || "",
    isFeatured: data?.isFeatured ?? false,
    isHero: data?.isHero ?? false,
    isLiked: data?.isLiked ?? false,
    isCustomizable: data?.isCustomizable ?? false,
    isNewArrival: data?.isNewArrival ?? false,
    createdAt: data?.createdAt,
    updatedAt: data?.updatedAt,
    averageRating: data?.averageRating || 0,
    reviewCount: data?.reviewCount || 0
  };
}

async function deleteProductImage(imageUrl: string): Promise<ServiceResponse<{}>> {
  try {
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const url = new URL(imageUrl);
    const fullPath = url.pathname.slice(1);
    const storagePath = fullPath.replace(`${bucket.name}/`, "");

    await bucket.file(storagePath).delete();
    return { success: true, data: {} };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error deleting image";
    return { success: false, error: message, status: 500 };
  }
}

export const adminProductService = {
  // ===================
  // GET ALL PRODUCTS
  // ===================
  async getAllProducts(filters?: {
    category?: string;
    subcategory?: string;
    material?: string;
    priceRange?: string;
    isFeatured?: boolean;
    isLiked?: boolean;
    stickySide?: string;
    brand?: string;
    tags?: string[];
    onSale?: boolean;
    isNewArrival?: boolean;
    isCustomizable?: boolean;
    baseColor?: string;
    productType?: string;
    designThemes?: string[];
    limit?: number;
    query?: string;
  }): Promise<ServiceResponse<ReturnType<typeof serializeProductArray>>> {
    // If any filters (including query) are provided, use getFilteredProducts
    if (filters && Object.keys(filters).some(key => key !== "limit")) {
      const filtered = await adminProductService.getFilteredProducts(filters as ProductFilterOptions);
      if (!filtered.success) return filtered;
      return { success: true, data: filtered.data };
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
        : (error as Error)?.message || "Unknown error fetching products";
      return { success: false, error: message, status: 500 };
    }
  },

  // ===================
  // GET FILTERED PRODUCTS
  // ===================
  async getFilteredProducts(
    filters: ProductFilterOptions
  ): Promise<ServiceResponse<ReturnType<typeof serializeProductArray>>> {
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

        if (!isNaN(minPrice)) q = q.where("price", ">=", minPrice);
        if (!isNaN(maxPrice)) q = q.where("price", "<=", maxPrice);
      }

      const snapshot = await q.get();
      let products = snapshot.docs.map(mapDocToProduct);

      // In-memory query filter
      if (filters.query) {
        const lower = filters.query.toLowerCase();
        products = products.filter(p => {
          const name = (p.name?.toLowerCase() || "").includes(lower);
          const desc = (p.description?.toLowerCase() || "").includes(lower);
          const tags = p.tags?.some(t => t.toLowerCase().includes(lower));
          return name || desc || tags;
        });
      }

      // In-memory array filters
      if (filters.designThemes && filters.designThemes.length > 0) {
        products = products.filter(p => p.designThemes?.some(t => filters.designThemes?.includes(t)));
      }
      if (filters.placements && filters.placements.length > 0) {
        products = products.filter(p => p.placements?.some(pl => filters.placements?.includes(pl)));
      }
      if (filters.tags && filters.tags.length > 0) {
        products = products.filter(p => p.tags?.some(tag => filters.tags?.includes(tag as string)));
      }

      return { success: true, data: serializeProductArray(products) };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : (error as Error)?.message || "Unknown error fetching filtered products";
      return { success: false, error: message, status: 500 };
    }
  },

  // ===================
  // ADD PRODUCT
  // ===================
  async addProduct(data: any): Promise<ServiceResponse<{ id: string; product: any }>> {
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

      if (!validatedData.sku) {
        await docRef.update({ sku: finalSku });
      }

      const fullProduct = {
        id: docRef.id,
        ...validatedData,
        sku: finalSku,
        createdAt: now,
        updatedAt: now
      };

      return { success: true, data: { id: docRef.id, product: fullProduct } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : (error as Error)?.message || "Unknown error adding product";
      return { success: false, error: message, status: 500 };
    }
  },

  // ===================
  // GET PRODUCT BY ID
  // ===================
  async getProductById(id: string): Promise<ServiceResponse<{ product: ReturnType<typeof serializeProduct> }>> {
    try {
      const db = getAdminFirestore();
      const doc = await db.collection("products").doc(id).get();

      if (!doc.exists) {
        return { success: false, error: "Product not found", status: 404 };
      }

      const product = mapDocToProduct(doc);
      const serialized = serializeProduct(product);

      return { success: true, data: { product: serialized } };
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
  // UPDATE PRODUCT
  // ===================
  async updateProduct(id: string, data: any): Promise<ServiceResponse<{ id: string }>> {
    try {
      if (!id) {
        return { success: false, error: "Product ID is required", status: 400 };
      }

      const validationResult = productUpdateSchema.safeParse(data);

      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors
          .map(err => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        return { success: false, error: `Validation failed: ${errorMessages}`, status: 400 };
      }

      const validatedData = validationResult.data;

      const updateData: Record<string, any> = {
        ...validatedData,
        updatedAt: new Date()
      };

      const db = getAdminFirestore();
      await db.collection("products").doc(id).update(updateData);

      return { success: true, data: { id } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : (error as Error)?.message || "Unknown error updating product";
      return { success: false, error: message, status: 500 };
    }
  },

  // ===================
  // DELETE PRODUCT
  // ===================
  async deleteProduct(productId: string): Promise<ServiceResponse<{}>> {
    try {
      const db = getAdminFirestore();
      const docRef = db.collection("products").doc(productId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return { success: false, error: "Product not found", status: 404 };
      }

      const data = docSnap.data();
      const imageUrl = data?.image;
      const additionalImages = data?.additionalImages || [];

      await docRef.delete();

      if (imageUrl) {
        await deleteProductImage(imageUrl);
      }

      for (const imgUrl of additionalImages) {
        await deleteProductImage(imgUrl);
      }

      return { success: true, data: {} };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : (error as Error)?.message || "Unknown error deleting product";
      return { success: false, error: message, status: 500 };
    }
  },

  // ===================
  // GET FEATURED PRODUCTS
  // ===================
  async getFeaturedProducts(): Promise<ServiceResponse<ReturnType<typeof serializeProductArray>>> {
    try {
      const db = getAdminFirestore();
      const snapshot = await db.collection("products").where("isFeatured", "==", true).get();
      const products = snapshot.docs.map(mapDocToProduct);
      return { success: true, data: serializeProductArray(products) };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : (error as Error)?.message || "Unknown error fetching featured products";
      return { success: false, error: message, status: 500 };
    }
  },

  // ===================
  // GET ON SALE PRODUCTS
  // ===================
  async getOnSaleProducts(limit = 10): Promise<ServiceResponse<ReturnType<typeof serializeProductArray>>> {
    try {
      const db = getAdminFirestore();
      let snapshot: FirebaseFirestore.QuerySnapshot;

      try {
        snapshot = await db
          .collection("products")
          .where("onSale", "==", true)
          .orderBy("createdAt", "desc")
          .limit(limit)
          .get();
      } catch {
        snapshot = await db.collection("products").orderBy("createdAt", "desc").get();
      }

      const products = snapshot.docs.map(mapDocToProduct);
      const saleProducts = products.filter(p => p.onSale === true).slice(0, limit);

      return { success: true, data: serializeProductArray(saleProducts) };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : (error as Error)?.message || "Unknown error fetching sale products";
      return { success: false, error: message, status: 500 };
    }
  },

  // ===================
  // GET NEW ARRIVALS
  // ===================
  async getNewArrivals(limit = 10): Promise<ServiceResponse<ReturnType<typeof serializeProductArray>>> {
    try {
      const db = getAdminFirestore();
      const snapshot = await db
        .collection("products")
        .where("isNewArrival", "==", true)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const products = snapshot.docs.map(mapDocToProduct);
      return { success: true, data: serializeProductArray(products) };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : (error as Error)?.message || "Unknown error fetching new arrivals";
      return { success: false, error: message, status: 500 };
    }
  },

  // ===================
  // GET RELATED PRODUCTS
  // ===================
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
        .limit(limit + 1)
        .get();

      let related = snapshot.docs
        .map(doc => mapDocToProduct(doc))
        .filter(p => p.id !== productId)
        .slice(0, limit);

      if (designTheme && related.length > 0) {
        const filteredByTheme = related.filter(p =>
          p.designThemes?.some(t => t === designTheme || t.toLowerCase() === designTheme.toLowerCase())
        );
        if (filteredByTheme.length >= 2) related = filteredByTheme.slice(0, limit);
      }

      if (tags && tags.length > 0 && related.length > 0) {
        const filteredByTags = related.filter(p => p.tags?.some(tag => tags.includes(tag)));
        if (filteredByTags.length >= 2) related = filteredByTags.slice(0, limit);
      }

      if (related.length === 0) {
        const fallbackSnapshot = await db.collection("products").orderBy("createdAt", "desc").limit(limit).get();
        const fallbackProducts = fallbackSnapshot.docs
          .map(doc => mapDocToProduct(doc))
          .filter(p => p.id !== productId)
          .slice(0, limit);

        return { success: true, data: serializeProductArray(fallbackProducts) };
      }

      return { success: true, data: serializeProductArray(related) };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : (error as Error)?.message || "Unknown error fetching related products";
      return { success: false, error: message, status: 500 };
    }
  },
  // ===================
  // GET THEMED PRODUCTS
  // ===================
  async getThemedProducts(limit = 6) {
    try {
      const db = getAdminFirestore();

      // Adjust this field name if yours differs:
      // Common variants: "designThemes" (array), "theme", "tags"
      const snapshot = await db
        .collection("products")
        .where("designThemes", "!=", null)
        .orderBy("designThemes")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const products = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data
        };
      });

      return { success: true as const, data: serializeProductArray(products) };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error fetching themed products";

      return { success: false as const, error: message };
    }
  }
};
