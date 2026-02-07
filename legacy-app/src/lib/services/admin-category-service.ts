// src/lib/services/admin-category-service.ts
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { requireAdmin } from "@/actions/_helpers/require-admin";
import {
  categories,
  subcategories,
  designThemes,
  productTypes,
  materials,
  placements,
  featuredCategoryMappings,
  type CategoryData as Category,
  normalizeCategory
} from "@/config/categories";

import type { ServiceResponse } from "@/lib/services/types/service-response";

/* ---------------------------------- */
/* Helpers */
/* ---------------------------------- */

type FeaturedCategory = {
  name: string;
  image: string;
  slug: string;
  count: number;
};

function getCategoryImage(category: string): string | undefined {
  const categoryImages: Record<string, string> = {
    Cars: "/images/categories/cars.jpg",
    Motorbikes: "/images/categories/motorbikes.jpg",
    EVs: "/images/categories/evs.jpg",
    Other: "/images/categories/other.jpg"
  };
  return categoryImages[category];
}

/* ---------------------------------- */
/* Service */
/* ---------------------------------- */

export const adminCategoryService = {
  /**
   * Public-safe: Get base category definitions without counts
   */
  async getCategories(): Promise<ServiceResponse<{ categories: Category[] }>> {
    try {
      const data: Category[] = categories.map(category => {
        const id = category.toLowerCase().replace(/\s+/g, "-");
        return {
          id,
          name: category,
          count: 0,
          image: getCategoryImage(category),
          icon: id
        };
      });

      return { success: true, data: { categories: data } };
    } catch (error: unknown) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Failed to fetch categories";
      return { success: false, error: message, status: 500 };
    }
  },

  /**
   * Admin-only: Optimized count() aggregation per category
   */
  async getCategoriesWithCounts(): Promise<ServiceResponse<{ categories: Category[] }>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    try {
      const db = getAdminFirestore();

      const categoryCounts = await Promise.all(
        categories.map(async category => {
          const snapshot = await db.collection("products").where("category", "==", category).count().get();
          return { category, count: snapshot.data().count };
        })
      );

      const countsMap = categoryCounts.reduce(
        (acc, curr) => {
          acc[curr.category] = curr.count;
          return acc;
        },
        {} as Record<string, number>
      );

      const data: Category[] = categories.map(category => {
        const id = category.toLowerCase().replace(/\s+/g, "-");
        return {
          id,
          name: category,
          count: countsMap[category] || 0,
          image: getCategoryImage(category),
          icon: id
        };
      });

      return { success: true, data: { categories: data } };
    } catch (error: unknown) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Error counting categories";
      return { success: false, error: message, status: 500 };
    }
  },

  /**
   * Get subcategories for a specific category
   */
  async getSubcategories(categoryParam: string): Promise<ServiceResponse<{ subcategories: string[] }>> {
    try {
      const normalized = normalizeCategory(categoryParam);
      if (!normalized) return { success: true, data: { subcategories: [] } };

      const list = subcategories[normalized as keyof typeof subcategories];
      return { success: true, data: { subcategories: list ? [...list] : [] } };
    } catch (error: unknown) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Error fetching subcategories";
      return { success: false, error: message, status: 500 };
    }
  },

  /**
   * Static lookup methods for config-driven values
   */
  async getDesignThemes(): Promise<ServiceResponse<{ designThemes: string[] }>> {
    return { success: true, data: { designThemes: [...designThemes] } };
  },

  async getProductTypes(): Promise<ServiceResponse<{ productTypes: string[] }>> {
    return { success: true, data: { productTypes: [...productTypes] } };
  },

  async getMaterials(): Promise<ServiceResponse<{ materials: string[] }>> {
    return { success: true, data: { materials: [...materials] } };
  },

  async getPlacements(): Promise<ServiceResponse<{ placements: string[] }>> {
    return { success: true, data: { placements: [...placements] } };
  },

  /**
   * Admin-only: Featured category counts using Firestore count() aggregation
   */
  async getFeaturedCategories(): Promise<ServiceResponse<{ featuredCategories: FeaturedCategory[] }>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    try {
      const featuredCategories: FeaturedCategory[] = [
        { name: "Sport Bike Decals", image: "/bike.jpg", slug: "sport-bike", count: 0 },
        { name: "Cruiser Graphics", image: "/car.jpg", slug: "cruiser", count: 0 },
        { name: "Off-Road Stickers", image: "/bike.jpg", slug: "off-road", count: 0 },
        { name: "Custom Designs", image: "/car.jpg", slug: "custom", count: 0 },
        { name: "Vintage Collection", image: "/car.jpg", slug: "vintage", count: 0 }
      ];

      const db = getAdminFirestore();

      await Promise.all(
        featuredCategories.map(async cat => {
          const mapping = featuredCategoryMappings[cat.slug as keyof typeof featuredCategoryMappings];
          if (!mapping) return;

          let query = db.collection("products") as FirebaseFirestore.Query;
          if (mapping.category) query = query.where("category", "==", mapping.category);
          if (mapping.subcategory) query = query.where("subcategory", "==", mapping.subcategory);
          if (mapping.productType) query = query.where("productType", "==", mapping.productType);

          if (mapping.designThemes && mapping.designThemes.length > 0) {
            query = query.where("designThemes", "array-contains-any", mapping.designThemes);
          }

          const countSnap = await query.count().get();
          cat.count = countSnap.data().count;
        })
      );

      return { success: true, data: { featuredCategories } };
    } catch (error: unknown) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Error counting featured categories";
      return { success: false, error: message, status: 500 };
    }
  }
};
