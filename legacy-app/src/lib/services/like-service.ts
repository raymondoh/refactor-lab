// ===============================
// 📂 src/lib/services/like-service.ts
// Canonical likes service (users/{userId}/likes/{productId})
// ===============================

import { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { serializeProductArray } from "@/utils/serializeProduct";
import type { Product } from "@/types/product";

import type { ServiceResponse } from "@/lib/services/types/service-response";

// Small local mapper (copied from old products file to keep behavior stable)
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

// Keep the same function names your API routes already use:
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

export async function getUserLikedProducts(userId: string) {
  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection("users").doc(userId).collection("likes").get();
    const likedProductIds = snapshot.docs.map(doc => doc.id);

    if (likedProductIds.length === 0) {
      return { success: true as const, data: [] };
    }

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

// Optional (future): canonical service-style exports
export const likeService = {
  likeProduct,
  unlikeProduct,
  getUserLikedProducts
};
