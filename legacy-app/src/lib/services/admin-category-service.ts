// src/lib/services/admin-category-service.ts
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
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

import { ok, fail, type ServiceResult } from "@/lib/services/service-result";

/* ---------------------------------- */
/* Helpers */
/* ---------------------------------- */

export type FeaturedCategory = {
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

function errMessage(error: unknown, fallback: string) {
  return isFirebaseError(error) ? firebaseError(error) : error instanceof Error ? error.message : fallback;
}

/* ---------------------------------- */
/* Service (Firestore-only; caller gates admin) */
/* ---------------------------------- */

export const adminCategoryService = {
  /**
   * Public-safe: Get base category definitions without counts
   */
  async getCategories(): Promise<ServiceResult<{ categories: Category[] }>> {
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

      return ok({ categories: data });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Failed to fetch categories"), 500);
    }
  },

  /**
   * Admin-only (caller must gate): Optimized count() aggregation per category
   */
  async getCategoriesWithCounts(): Promise<ServiceResult<{ categories: Category[] }>> {
    try {
      const db = getAdminFirestore();

      const categoryCounts = await Promise.all(
        categories.map(async category => {
          const snapshot = await db.collection("products").where("category", "==", category).count().get();
          return { category, count: snapshot.data().count };
        })
      );

      const countsMap = categoryCounts.reduce<Record<string, number>>((acc, curr) => {
        acc[curr.category] = curr.count;
        return acc;
      }, {});

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

      return ok({ categories: data });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Error counting categories"), 500);
    }
  },

  /**
   * Get subcategories for a specific category
   */
  async getSubcategories(categoryParam: string): Promise<ServiceResult<{ subcategories: string[] }>> {
    try {
      const normalized = normalizeCategory(categoryParam);
      if (!normalized) return ok({ subcategories: [] });

      const list = subcategories[normalized as keyof typeof subcategories];
      return ok({ subcategories: list ? [...list] : [] });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Error fetching subcategories"), 500);
    }
  },

  /**
   * Static lookup methods for config-driven values
   */
  async getDesignThemes(): Promise<ServiceResult<{ designThemes: string[] }>> {
    return ok({ designThemes: [...designThemes] });
  },

  async getProductTypes(): Promise<ServiceResult<{ productTypes: string[] }>> {
    return ok({ productTypes: [...productTypes] });
  },

  async getMaterials(): Promise<ServiceResult<{ materials: string[] }>> {
    return ok({ materials: [...materials] });
  },

  async getPlacements(): Promise<ServiceResult<{ placements: string[] }>> {
    return ok({ placements: [...placements] });
  },

  /**
   * Admin-only (caller must gate): Featured category counts using Firestore count() aggregation
   */
  async getFeaturedCategories(): Promise<ServiceResult<{ featuredCategories: FeaturedCategory[] }>> {
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

      return ok({ featuredCategories });
    } catch (error: unknown) {
      return fail("UNKNOWN", errMessage(error, "Error counting featured categories"), 500);
    }
  }
};
