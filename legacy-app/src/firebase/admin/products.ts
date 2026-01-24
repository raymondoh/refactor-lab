// ===============================
// 📂 src/firebase/admin/products.ts
// ===============================

// ================= Imports =================
import { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin/initialize";
import type { DocumentData } from "firebase-admin/firestore";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import type { Product, ProductFilterOptions } from "@/types/product";
import { serializeProduct, serializeProductArray } from "@/utils/serializeProduct";
import { productSchema, productUpdateSchema } from "@/schemas/product";
import { normalizeCategory, normalizeSubcategory } from "@/config/categories";
//import { average } from "firebase/firestore"; // This import seems unused and can be removed

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

// ===================
// GET ALL PRODUCTS
// ===================
// NEW: Update filters type to include query
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
  query?: string; // NEW: Added query parameter here
}) {
  // If any filters (including query) are provided, use getFilteredProducts
  if (filters && Object.keys(filters).some(key => key !== "limit")) {
    return await getFilteredProducts(filters);
  }

  // Original logic for fetching all products if no specific filters are applied
  try {
    const db = getAdminFirestore();
    let query = db.collection("products").orderBy("createdAt", "desc");

    // Apply limit if provided
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

    // Normalize category and subcategory using the mapping functions
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
    // Start with the base query. We'll apply string-based filters in-memory later if needed.
    let query = db.collection("products").orderBy("createdAt", "desc");

    // Apply direct Firestore filters (exact matches, ranges, booleans)
    if (filters.category) {
      console.log("getFilteredProducts - Adding category filter:", filters.category);
      query = query.where("category", "==", filters.category);
    }
    if (filters.subcategory) {
      console.log("getFilteredProducts - Adding subcategory filter:", filters.subcategory);
      query = query.where("subcategory", "==", filters.subcategory);
    }
    if (filters.material) {
      query = query.where("material", "==", filters.material);
    }
    if (filters.finish) {
      query = query.where("finish", "==", filters.finish);
    }
    if (filters.productType) {
      query = query.where("productType", "==", filters.productType);
    }
    if (filters.stickySide) {
      query = query.where("stickySide", "==", filters.stickySide);
    }
    if (filters.brand) {
      query = query.where("brand", "==", filters.brand);
    }
    if (filters.baseColor) {
      query = query.where("baseColor", "==", filters.baseColor);
    }

    // Boolean filters
    if (filters.isFeatured !== undefined) {
      query = query.where("isFeatured", "==", filters.isFeatured);
    }
    if (filters.isCustomizable !== undefined) {
      query = query.where("isCustomizable", "==", filters.isCustomizable);
    }
    if (filters.onSale !== undefined) {
      query = query.where("onSale", "==", filters.onSale);
    }
    if (filters.isNewArrival !== undefined) {
      query = query.where("isNewArrival", "==", filters.isNewArrival);
    }
    if (filters.inStock !== undefined) {
      query = query.where("inStock", "==", filters.inStock);
    }

    // Price range filter
    if (filters.priceRange) {
      const [minPriceStr, maxPriceStr] = filters.priceRange.split("-");
      const minPrice = Number.parseFloat(minPriceStr);
      const maxPrice = Number.parseFloat(maxPriceStr);

      if (!isNaN(minPrice)) {
        query = query.where("price", ">=", minPrice);
      }
      if (!isNaN(maxPrice)) {
        query = query.where("price", "<=", maxPrice);
      }
    }

    const snapshot = await query.get();
    let products = snapshot.docs.map(mapDocToProduct);

    // NEW: Apply in-memory search query filter
    if (filters.query) {
      const lowerCaseQuery = filters.query.toLowerCase();
      products = products.filter(
        product =>
          // Safely access product.name and product.description
          (product.name?.toLowerCase() || "").includes(lowerCaseQuery) || // FIX: Safely access name
          (product.description?.toLowerCase() || "").includes(lowerCaseQuery) || // FIX: Safely access description
          product.tags?.some(tag => tag.toLowerCase().includes(lowerCaseQuery))
      );
      console.log(
        `getFilteredProducts - Applied in-memory search for "${filters.query}", found ${products.length} results.`
      );
    }

    // In-memory filters for array fields (these were already here, keep them after the main query filter)
    if (filters.designThemes && filters.designThemes.length > 0) {
      products = products.filter(product => product.designThemes?.some(theme => filters.designThemes?.includes(theme)));
    }
    if (filters.placements && filters.placements.length > 0) {
      products = products.filter(product =>
        product.placements?.some(placement => filters.placements?.includes(placement))
      );
    }
    if (filters.tags && filters.tags.length > 0) {
      // Note: tags already handled in main query filter above if `filters.query` exists.
      // This part ensures that if tags are used as a *direct filter* (e.g., `tags=sport,cars`), they are still applied.
      // If `filters.query` also matches tags, some redundancy, but correct filtering logic.
      products = products.filter(product => product.tags?.some(tag => filters.tags?.includes(tag as string)));
    }

    // Log a sample product to see its structure
    if (products.length > 0) {
      console.log("getFilteredProducts - Sample product:", {
        id: products[0].id,
        name: products[0].name, // NEW: Include name for easier debugging
        category: products[0].category,
        subcategory: products[0].subcategory
      });
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

// ... (rest of your file, e.g., addProduct, getProductById, etc. remain unchanged)

// ===================
// ADD PRODUCT
// ===================
export async function addProduct(data: any) {
  try {
    console.log("🚀 addProduct - Starting creation");
    console.log("📋 addProduct - Raw input data:", JSON.stringify(data, null, 2));

    // Validate using the full product schema
    const validationResult = productSchema.safeParse(data);

    if (!validationResult.success) {
      console.error("❌ Schema validation failed:", validationResult.error.errors);
      const errorMessages = validationResult.error.errors
        .map(err => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      return { success: false as const, error: `Validation failed: ${errorMessages}` };
    }

    const validatedData = validationResult.data;
    console.log("✅ Schema validation passed. Validated data:", JSON.stringify(validatedData, null, 2));

    const now = new Date();

    // Data to be added to Firestore
    const newProductData = {
      ...validatedData,
      createdAt: now,
      updatedAt: now
    };

    console.log("🔥 FINAL - Product data being sent to Firebase:", JSON.stringify(newProductData, null, 2));

    const db = getAdminFirestore();
    const docRef = await db.collection("products").add(newProductData);
    console.log("✅ Firebase creation completed successfully with ID:", docRef.id);

    // SKU Generation Logic
    const finalSku = validatedData.sku ?? `SKU-${docRef.id.substring(0, 8).toUpperCase()}`;

    // If a new SKU was generated, update the document in Firestore
    if (!validatedData.sku) {
      console.log(`📦 SKU not provided. Generating and updating with: ${finalSku}`);
      await docRef.update({ sku: finalSku });
      console.log("✅ SKU updated in Firebase.");
    }

    // Construct the complete product object to return to the caller
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
  console.log(`[getProductById] Called for product ID: ${id}`);

  try {
    const db = getAdminFirestore();
    console.log(`[getProductById] Using Firestore client for product ID: ${id}`);

    const doc = await db.collection("products").doc(id).get();

    if (!doc.exists) {
      console.warn(`[getProductById] Product with ID: '${id}' not found in Firestore.`);
      return { success: false as const, error: "Product not found" };
    }

    console.log(`[getProductById] Successfully fetched document for product ID: '${id}'. Exists: true.`);
    const product = mapDocToProduct(doc);
    const serialized = serializeProduct(product);

    console.log(`[getProductById] Product mapped and serialized for ID: '${id}'.`);
    return { success: true as const, product: serialized };
  } catch (error) {
    console.error(`[getProductById] Firebase error occurred while fetching product ID '${id}':`, error);

    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error fetching product by ID";

    console.error(`[getProductById] Processed error message for ID '${id}': ${message}`);
    return { success: false as const, error: message };
  }
}

// ===================
// UPDATE PRODUCT
// ===================
export async function updateProduct(id: string, data: any) {
  try {
    if (!id) {
      throw new Error("Product ID is required");
    }

    console.log("🚀 updateProduct - Starting update for:", id);
    console.log("📋 updateProduct - Raw input data:", JSON.stringify(data, null, 2));

    // Use the update schema for validation (all fields optional)
    const validationResult = productUpdateSchema.safeParse(data);

    if (!validationResult.success) {
      console.error("❌ Schema validation failed:", validationResult.error.errors);
      const errorMessages = validationResult.error.errors
        .map(err => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      return { success: false as const, error: `Validation failed: ${errorMessages}` };
    }

    const validatedData = validationResult.data;
    console.log("✅ Schema validation passed. Validated data:", JSON.stringify(validatedData, null, 2));

    // Specifically log sale-related fields
    console.log("🏷️ Sale fields after validation:", {
      onSale: validatedData.onSale,
      salePrice: validatedData.salePrice,
      price: validatedData.price
    });

    // Create update object with validated fields
    const updateData: Record<string, any> = {
      ...validatedData,
      updatedAt: new Date()
    };

    console.log("🔥 FINAL - Update data being sent to Firebase:", JSON.stringify(updateData, null, 2));

    const db = getAdminFirestore();
    await db.collection("products").doc(id).update(updateData);

    console.log("✅ Firebase update completed successfully");

    return { success: true as const, data: id };
  } catch (error) {
    console.error("❌ updateProduct error:", error);
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

    const data = docSnap.data();
    const imageUrl = data?.image;
    const additionalImages = data?.additionalImages || [];

    await docRef.delete();

    // Delete main image
    if (imageUrl) await deleteProductImage(imageUrl);

    // Delete additional images
    for (const imgUrl of additionalImages) {
      await deleteProductImage(imgUrl);
    }

    return { success: true as const };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error deleting product";
    console.error("Error deleting product:", message);
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
    console.error("❌ Error deleting image:", message);
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
    console.log("🏷️ getOnSaleProducts - Starting query for sale products");

    const db = getAdminFirestore();
    let snapshot;

    try {
      snapshot = await db
        .collection("products")
        .where("onSale", "==", true)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      console.log("🏷️ getOnSaleProducts - Direct query found:", snapshot.docs.length, "products");
    } catch (queryError) {
      console.log("🏷️ getOnSaleProducts - Direct query failed, trying fallback approach");

      // Fallback: get all products and filter in memory
      snapshot = await db.collection("products").orderBy("createdAt", "desc").get();

      console.log("🏷️ getOnSaleProducts - Fallback: got", snapshot.docs.length, "total products");
    }

    const products = snapshot.docs.map(mapDocToProduct);

    // Always filter in memory to be extra sure
    const saleProducts = products.filter(product => {
      const isOnSale = product.onSale === true;
      if (isOnSale) {
        console.log("🏷️ Found sale product:", {
          name: product.name,
          onSale: product.onSale,
          price: product.price,
          salePrice: product.salePrice
        });
      }
      return isOnSale;
    });

    // Apply limit if we did fallback approach
    const finalProducts = saleProducts.slice(0, limit);

    console.log("🏷️ getOnSaleProducts - Final result:", finalProducts.length, "sale products");

    return { success: true as const, data: serializeProductArray(finalProducts) };
  } catch (error) {
    console.error("❌ getOnSaleProducts error:", error);
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

    // Apply category filter
    if (category) {
      query = query.where("category", "==", category);
    }

    // Apply subcategory filter if provided
    if (subcategory) {
      query = query.where("subcategory", "==", subcategory);
    }

    // Apply product type filter if provided
    if (productType) {
      query = query.where("productType", "==", productType);
    }

    // Apply brand filter if provided
    if (brand) {
      query = query.where("brand", "==", brand);
    }

    // Apply ordering and limit
    const snapshot = await query
      .orderBy("createdAt", "desc")
      .limit(limit + 1)
      .get();

    let related = snapshot.docs
      .map(doc => mapDocToProduct(doc))
      .filter(product => product.id !== productId)
      .slice(0, limit);

    // If design theme is provided, filter in memory
    if (designTheme && related.length > 0) {
      const filteredByTheme = related.filter(product =>
        product.designThemes?.some(theme => theme === designTheme || theme.toLowerCase() === designTheme.toLowerCase())
      );

      // If we have enough products with the theme, use those
      if (filteredByTheme.length >= 2) {
        related = filteredByTheme.slice(0, limit);
      }
    }

    // If tags are provided, filter in memory
    if (tags && tags.length > 0 && related.length > 0) {
      const filteredByTags = related.filter(product => product.tags?.some(tag => tags.includes(tag)));

      // If we have enough products with matching tags, use those
      if (filteredByTags.length >= 2) {
        related = filteredByTags.slice(0, limit);
      }
    }

    // If no products found with the filters, try a broader search
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
    console.error("Error liking product:", message);
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
    console.error("Error unliking product:", message);
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
    console.error("Error fetching liked products:", message);
    return { success: false as const, error: message };
  }
}
