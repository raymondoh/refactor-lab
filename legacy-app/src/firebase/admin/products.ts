// ===============================
// 📂 src/firebase/admin/products.ts
// ===============================

// ================= Imports =================
import { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin/initialize";
import type { DocumentData } from "firebase-admin/firestore";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import type { Product } from "@/types/models/product";
import type { ProductFilterOptions } from "@/types/filters/product-filters";
import { serializeProduct, serializeProductArray } from "@/utils/serializeProduct";
import { productSchema, productUpdateSchema } from "@/schemas/product";
import { normalizeCategory, normalizeSubcategory } from "@/config/categories";

// --------------------
// helpers (no any)
// --------------------
function asRecord(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}

function mapDocToProduct(doc: FirebaseFirestore.DocumentSnapshot): Product {
  const data = asRecord(doc.data());

  const imageRaw = data["image"];
  const image = typeof imageRaw === "string" && imageRaw ? imageRaw : "/placeholder.svg";

  const additionalImagesRaw = data["additionalImages"];
  const additionalImages = Array.isArray(additionalImagesRaw) ? additionalImagesRaw : [];

  const imagesRaw = data["images"];
  const images =
    Array.isArray(imagesRaw) && imagesRaw.length > 0
      ? imagesRaw.map(v => (typeof v === "string" ? v : "")).filter(Boolean)
      : imageRaw
        ? [image, ...additionalImages.map(v => (typeof v === "string" ? v : "")).filter(Boolean)]
        : additionalImages.map(v => (typeof v === "string" ? v : "")).filter(Boolean);

  // --- MOVE LOGIC HERE (BEFORE THE RETURN) ---
  const rawSticky = data["stickySide"];
  const stickySide = rawSticky === "Front" || rawSticky === "Back" ? rawSticky : undefined;

  const createdAt = data["createdAt"];
  const updatedAt = data["updatedAt"];
  // --------------------------------------------

  return {
    id: doc.id,
    name: typeof data["name"] === "string" ? data["name"] : "",
    description: typeof data["description"] === "string" ? data["description"] : "",
    details: typeof data["details"] === "string" ? data["details"] : "",
    sku: typeof data["sku"] === "string" ? data["sku"] : "",
    barcode: typeof data["barcode"] === "string" ? data["barcode"] : "",
    category: typeof data["category"] === "string" ? data["category"] : "",
    subcategory: typeof data["subcategory"] === "string" ? data["subcategory"] : "",
    designThemes: Array.isArray(data["designThemes"]) ? (data["designThemes"] as string[]) : [],
    productType: typeof data["productType"] === "string" ? data["productType"] : "",
    tags: Array.isArray(data["tags"]) ? (data["tags"] as string[]) : [],
    brand: typeof data["brand"] === "string" ? data["brand"] : "",
    manufacturer: typeof data["manufacturer"] === "string" ? data["manufacturer"] : "",
    dimensions: typeof data["dimensions"] === "string" ? data["dimensions"] : "",
    weight: typeof data["weight"] === "string" ? data["weight"] : "",
    shippingWeight: typeof data["shippingWeight"] === "string" ? data["shippingWeight"] : "",
    material: typeof data["material"] === "string" ? data["material"] : "",
    finish: typeof data["finish"] === "string" ? data["finish"] : undefined,
    color: typeof data["color"] === "string" ? data["color"] : "",
    baseColor: typeof data["baseColor"] === "string" ? data["baseColor"] : "",
    colorDisplayName: typeof data["colorDisplayName"] === "string" ? data["colorDisplayName"] : "",

    // Use the variables calculated above
    stickySide,

    size: typeof data["size"] === "string" ? data["size"] : "",
    image,
    additionalImages: additionalImages.map(v => (typeof v === "string" ? v : "")).filter(Boolean),
    images,
    placements: Array.isArray(data["placements"]) ? (data["placements"] as string[]) : [],
    price: typeof data["price"] === "number" ? data["price"] : 0,
    salePrice: typeof data["salePrice"] === "number" ? data["salePrice"] : undefined,
    onSale: typeof data["onSale"] === "boolean" ? data["onSale"] : false,
    costPrice: typeof data["costPrice"] === "number" ? data["costPrice"] : undefined,
    stockQuantity: typeof data["stockQuantity"] === "number" ? data["stockQuantity"] : undefined,
    lowStockThreshold: typeof data["lowStockThreshold"] === "number" ? data["lowStockThreshold"] : undefined,
    shippingClass: typeof data["shippingClass"] === "string" ? data["shippingClass"] : "",
    inStock: typeof data["inStock"] === "boolean" ? data["inStock"] : true,
    badge: typeof data["badge"] === "string" ? data["badge"] : "",
    isFeatured: typeof data["isFeatured"] === "boolean" ? data["isFeatured"] : false,
    isHero: typeof data["isHero"] === "boolean" ? data["isHero"] : false,
    isLiked: typeof data["isLiked"] === "boolean" ? data["isLiked"] : false,
    isCustomizable: typeof data["isCustomizable"] === "boolean" ? data["isCustomizable"] : false,
    isNewArrival: typeof data["isNewArrival"] === "boolean" ? data["isNewArrival"] : false,

    // Assign calculated variables
    // In mapDocToProduct functions:
    createdAt: data["createdAt"] as any, // Or use a helper to ensure it's Timestamp | string
    updatedAt: data["updatedAt"] as any,

    averageRating: typeof data["averageRating"] === "number" ? data["averageRating"] : 0,
    reviewCount: typeof data["reviewCount"] === "number" ? data["reviewCount"] : 0
  };
}

// ===================
// GET ALL PRODUCTS
// ===================
export async function getAllProducts(filters?: {
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
}) {
  if (filters && Object.keys(filters).some(key => key !== "limit")) {
    return await getFilteredProducts(filters);
  }

  try {
    const db = getAdminFirestore();
    let query = db.collection("products").orderBy("createdAt", "desc");

    if (filters?.limit && typeof filters.limit === "number" && filters.limit > 0) {
      query = query.limit(filters.limit);
    }

    const snapshot = await query.get();
    const products = snapshot.docs.map(mapDocToProduct);
    return { success: true as const, data: serializeProductArray(products) };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error fetching products";
    return { success: false as const, error: message };
  }
}

// ===================
// GET FILTERED PRODUCTS
// ===================
export async function getFilteredProducts(filters: ProductFilterOptions) {
  try {
    console.log("getFilteredProducts - Received filters:", filters);

    if (filters.category) {
      const normalizedCategory = normalizeCategory(filters.category);
      if (normalizedCategory) {
        filters.category = normalizedCategory;
        console.log("getFilteredProducts - Normalized category filter:", filters.category);
      }
    }

    if (filters.subcategory && filters.category) {
      const normalizedCategory = normalizeCategory(filters.category);
      const normalizedSubcategory = normalizeSubcategory(filters.subcategory, normalizedCategory);
      if (normalizedSubcategory) {
        filters.subcategory = normalizedSubcategory;
        console.log("getFilteredProducts - Normalized subcategory filter:", filters.subcategory);
      }
    }

    const db = getAdminFirestore();
    let query = db.collection("products").orderBy("createdAt", "desc");

    if (filters.category) query = query.where("category", "==", filters.category);
    if (filters.subcategory) query = query.where("subcategory", "==", filters.subcategory);
    if (filters.material) query = query.where("material", "==", filters.material);
    if (filters.finish) query = query.where("finish", "==", filters.finish);
    if (filters.productType) query = query.where("productType", "==", filters.productType);
    if (filters.stickySide) query = query.where("stickySide", "==", filters.stickySide);
    if (filters.brand) query = query.where("brand", "==", filters.brand);
    if (filters.baseColor) query = query.where("baseColor", "==", filters.baseColor);

    if (filters.isFeatured !== undefined) query = query.where("isFeatured", "==", filters.isFeatured);
    if (filters.isCustomizable !== undefined) query = query.where("isCustomizable", "==", filters.isCustomizable);
    if (filters.onSale !== undefined) query = query.where("onSale", "==", filters.onSale);
    if (filters.isNewArrival !== undefined) query = query.where("isNewArrival", "==", filters.isNewArrival);
    if (filters.inStock !== undefined) query = query.where("inStock", "==", filters.inStock);

    if (filters.priceRange) {
      const [minPriceStr, maxPriceStr] = filters.priceRange.split("-");
      const minPrice = Number.parseFloat(minPriceStr);
      const maxPrice = Number.parseFloat(maxPriceStr);

      if (!Number.isNaN(minPrice)) query = query.where("price", ">=", minPrice);
      if (!Number.isNaN(maxPrice)) query = query.where("price", "<=", maxPrice);
    }

    const snapshot = await query.get();
    let products = snapshot.docs.map(mapDocToProduct);

    // query filter (no explicit any)
    if (filters.query) {
      const q = filters.query.toLowerCase();
      products = products.filter(p => {
        const name = (p.name ?? "").toLowerCase().includes(q);
        const desc = (p.description ?? "").toLowerCase().includes(q);
        const tags =
          Array.isArray(p.tags) &&
          (p.tags as unknown[]).some(t =>
            String(t ?? "")
              .toLowerCase()
              .includes(q)
          );
        return name || desc || tags;
      });
    }

    if (filters.designThemes && filters.designThemes.length > 0) {
      products = products.filter(product => product.designThemes?.some(theme => filters.designThemes?.includes(theme)));
    }
    if (filters.placements && filters.placements.length > 0) {
      products = products.filter(product =>
        product.placements?.some(placement => filters.placements?.includes(placement))
      );
    }
    if (filters.tags && filters.tags.length > 0) {
      // remove "as any" by treating tags as string[] and using String() fallback
      const wanted = new Set(filters.tags.map(t => String(t).toLowerCase()));
      products = products.filter(product => (product.tags ?? []).some(tag => wanted.has(String(tag).toLowerCase())));
    }

    return { success: true as const, data: serializeProductArray(products) };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error fetching filtered products";
    console.error("Error in getFilteredProducts:", message, error);
    return { success: false as const, error: message };
  }
}

// ===================
// ADD PRODUCT
// ===================
// ✅ fix @typescript-eslint/no-explicit-any at line ~265
export async function addProduct(data: unknown) {
  try {
    console.log("🚀 addProduct - Starting creation");
    console.log("📋 addProduct - Raw input data:", JSON.stringify(data, null, 2));

    const validationResult = productSchema.safeParse(data);

    if (!validationResult.success) {
      console.error("❌ Schema validation failed:", validationResult.error.errors);
      const errorMessages = validationResult.error.errors
        .map(err => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      return { success: false as const, error: `Validation failed: ${errorMessages}` };
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

    return {
      success: true as const,
      id: docRef.id,
      product: fullProduct
    };
  } catch (error) {
    console.error("❌ addProduct error:", error);
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error adding product";
    return { success: false as const, error: message };
  }
}

// ===================
// GET PRODUCT BY ID
// ===================
export async function getProductById(id: string) {
  try {
    const db = getAdminFirestore();
    const doc = await db.collection("products").doc(id).get();

    if (!doc.exists) {
      return { success: false as const, error: "Product not found" };
    }

    const product = mapDocToProduct(doc);
    const serialized = serializeProduct(product);

    return { success: true as const, product: serialized };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error fetching product by ID";
    return { success: false as const, error: message };
  }
}

// ===================
// UPDATE PRODUCT
// ===================
// ✅ fix @typescript-eslint/no-explicit-any at line ~372
export async function updateProduct(id: string, data: unknown) {
  try {
    if (!id) throw new Error("Product ID is required");

    const validationResult = productUpdateSchema.safeParse(data);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map(err => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      return { success: false as const, error: `Validation failed: ${errorMessages}` };
    }

    const validatedData = validationResult.data;

    // ✅ fix explicit any in update object (line ~403)
    const updateData: Record<string, unknown> = {
      ...validatedData,
      updatedAt: new Date()
    };

    // optional: strip undefineds
    Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

    const db = getAdminFirestore();
    await db.collection("products").doc(id).update(updateData);

    return { success: true as const, data: id };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error updating product";
    return { success: false as const, error: message };
  }
}

// ===================
// DELETE PRODUCT
// ===================
export async function deleteProduct(productId: string) {
  try {
    const db = getAdminFirestore();
    const docRef = db.collection("products").doc(productId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { success: false as const, error: "Product not found" };
    }

    const data = asRecord(docSnap.data());
    const imageUrl = data["image"];
    const additionalImagesRaw = data["additionalImages"];
    const additionalImages = Array.isArray(additionalImagesRaw) ? additionalImagesRaw : [];

    await docRef.delete();

    if (typeof imageUrl === "string" && imageUrl) await deleteProductImage(imageUrl);

    for (const imgUrl of additionalImages) {
      if (typeof imgUrl === "string" && imgUrl) await deleteProductImage(imgUrl);
    }

    return { success: true as const };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error deleting product";
    return { success: false as const, error: message };
  }
}

// ===================
// DELETE PRODUCT IMAGE
// ===================
export async function deleteProductImage(imageUrl: string) {
  try {
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const url = new URL(imageUrl);
    const fullPath = url.pathname.slice(1);
    const storagePath = fullPath.replace(`${bucket.name}/`, "");

    await bucket.file(storagePath).delete();

    return { success: true as const };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error deleting image";
    return { success: false as const, error: message };
  }
}

// ===================
// GET FEATURED PRODUCTS
// ===================
export async function getFeaturedProducts() {
  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection("products").where("isFeatured", "==", true).get();
    const products = snapshot.docs.map(mapDocToProduct);
    return { success: true as const, data: serializeProductArray(products) };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error fetching featured products";
    return { success: false as const, error: message };
  }
}

// ===================
// GET ON SALE PRODUCTS
// ===================
export async function getOnSaleProducts(limit = 10) {
  try {
    const db = getAdminFirestore();
    let snapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>;

    try {
      snapshot = await db
        .collection("products")
        .where("onSale", "==", true)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();
    } catch (err) {
      // ✅ fix unused var: remove queryError name and keep useful logging
      console.warn("getOnSaleProducts - direct query failed, using fallback:", err);

      snapshot = await db.collection("products").orderBy("createdAt", "desc").get();
    }

    const products = snapshot.docs.map(mapDocToProduct);

    const saleProducts = products.filter(p => p.onSale === true);

    // If fallback fetched all, enforce limit
    const finalProducts = saleProducts.slice(0, limit);

    return { success: true as const, data: serializeProductArray(finalProducts) };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error fetching sale products";
    return { success: false as const, error: message };
  }
}

// ===================
// GET NEW ARRIVALS
// ===================
export async function getNewArrivals(limit = 10) {
  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection("products")
      .where("isNewArrival", "==", true)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const products = snapshot.docs.map(mapDocToProduct);
    return { success: true as const, data: serializeProductArray(products) };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error fetching new arrivals";
    return { success: false as const, error: message };
  }
}

// ===================
// GET RELATED PRODUCTS
// ===================
interface GetRelatedProductsParams {
  productId: string;
  category?: string;
  subcategory?: string;
  designTheme?: string;
  productType?: string;
  brand?: string;
  tags?: string[];
  limit?: number;
}

export async function getRelatedProducts({
  productId,
  category,
  subcategory,
  designTheme,
  productType,
  brand,
  tags,
  limit = 4
}: GetRelatedProductsParams) {
  try {
    const db = getAdminFirestore();
    let query = db.collection("products") as FirebaseFirestore.Query<DocumentData>;

    if (category) query = query.where("category", "==", category);
    if (subcategory) query = query.where("subcategory", "==", subcategory);
    if (productType) query = query.where("productType", "==", productType);
    if (brand) query = query.where("brand", "==", brand);

    const snapshot = await query
      .orderBy("createdAt", "desc")
      .limit(limit + 1)
      .get();

    let related = snapshot.docs
      .map(doc => mapDocToProduct(doc))
      .filter(product => product.id !== productId)
      .slice(0, limit);

    if (designTheme && related.length > 0) {
      const dt = designTheme.toLowerCase();
      const filteredByTheme = related.filter(product =>
        (product.designThemes ?? []).some(theme => String(theme).toLowerCase() === dt)
      );
      if (filteredByTheme.length >= 2) related = filteredByTheme.slice(0, limit);
    }

    if (tags && tags.length > 0 && related.length > 0) {
      const wanted = new Set(tags.map(t => t.toLowerCase()));
      const filteredByTags = related.filter(product =>
        (product.tags ?? []).some(tag => wanted.has(String(tag).toLowerCase()))
      );
      if (filteredByTags.length >= 2) related = filteredByTags.slice(0, limit);
    }

    if (related.length === 0) {
      const fallbackSnapshot = await db.collection("products").orderBy("createdAt", "desc").limit(limit).get();

      const fallbackProducts = fallbackSnapshot.docs
        .map(doc => mapDocToProduct(doc))
        .filter(product => product.id !== productId)
        .slice(0, limit);

      return { success: true as const, products: serializeProductArray(fallbackProducts) };
    }

    return { success: true as const, products: serializeProductArray(related) };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error fetching related products";
    return { success: false as const, error: message };
  }
}

// ===================
// LIKE A PRODUCT
// ===================
export async function likeProduct(userId: string, productId: string) {
  try {
    const db = getAdminFirestore();
    const now = Timestamp.now();
    const likeRef = db.collection("users").doc(userId).collection("likes").doc(productId);

    await likeRef.set({
      productId,
      createdAt: now
    });

    return { success: true as const };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error liking product";
    return { success: false as const, error: message };
  }
}

// ===================
// UNLIKE A PRODUCT
// ===================
export async function unlikeProduct(userId: string, productId: string) {
  try {
    const db = getAdminFirestore();
    const likeRef = db.collection("users").doc(userId).collection("likes").doc(productId);
    await likeRef.delete();
    return { success: true as const };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error unliking product";
    return { success: false as const, error: message };
  }
}

// ===================
// GET LIKED PRODUCTS
// ===================
export async function getUserLikedProducts(userId: string) {
  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection("users").doc(userId).collection("likes").get();
    const likedProductIds = snapshot.docs.map(doc => doc.id);

    if (likedProductIds.length === 0) return { success: true as const, data: [] };

    const productDocs = await Promise.all(likedProductIds.map(id => db.collection("products").doc(id).get()));

    const products = productDocs.filter(doc => doc.exists).map(doc => mapDocToProduct(doc));

    return { success: true as const, data: serializeProductArray(products) };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error fetching liked products";
    return { success: false as const, error: message };
  }
}
