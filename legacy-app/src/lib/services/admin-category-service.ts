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

import type { ServiceResponse } from "@/lib/services/types/service-response";

function getCategoryImage(category: string): string | undefined {
  const categoryImages: Record<string, string> = {
    Cars: "/images/categories/cars.jpg",
    Motorbikes: "/images/categories/motorbikes.jpg",
    EVs: "/images/categories/evs.jpg",
    Trucks: "/images/categories/trucks.jpg",
    Boats: "/images/categories/boats.jpg",
    Planes: "/images/categories/planes.jpg"
  };
  return categoryImages[category];
}

export const adminCategoryService = {
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
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : (error as Error)?.message || "Unknown error fetching categories";
      return { success: false, error: message, status: 500 };
    }
  },

  async getCategoriesWithCounts(): Promise<ServiceResponse<{ categories: Category[] }>> {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection("products").select("category").get();

      const counts: Record<string, number> = {};
      snap.docs.forEach(doc => {
        const category = (doc.data() as any).category;
        if (category) counts[category] = (counts[category] || 0) + 1;
      });

      const data: Category[] = categories.map(category => ({
        id: category.toLowerCase().replace(/\s+/g, "-"),
        name: category,
        count: counts[category] || 0,
        image: getCategoryImage(category),
        icon: category.toLowerCase().replace(/\s+/g, "-")
      }));

      return { success: true, data: { categories: data } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : (error as Error)?.message || "Unknown error fetching categories";
      return { success: false, error: message, status: 500 };
    }
  },

  async getSubcategories(categoryParam: string): Promise<ServiceResponse<{ subcategories: string[] }>> {
    try {
      const normalized = normalizeCategory(categoryParam);
      if (!normalized) return { success: true, data: { subcategories: [] } };

      const list = subcategories[normalized as keyof typeof subcategories];
      return { success: true, data: { subcategories: list ? [...list] : [] } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : (error as Error)?.message || "Unknown error fetching subcategories";
      return { success: false, error: message, status: 500 };
    }
  },

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

  async getFeaturedCategories(): Promise<ServiceResponse<{ featuredCategories: any[] }>> {
    try {
      const featuredCategories = [
        { name: "Sport Bike Decals", image: "/bike.jpg", slug: "sport-bike", count: 0 },
        { name: "Cruiser Graphics", image: "/car.jpg", slug: "cruiser", count: 0 },
        { name: "Off-Road Stickers", image: "/bike.jpg", slug: "off-road", count: 0 },
        { name: "Custom Designs", image: "/car.jpg", slug: "custom", count: 0 },
        { name: "Vintage Collection", image: "/car.jpg", slug: "vintage", count: 0 }
      ];

      const db = getAdminFirestore();
      const snap = await db.collection("products").get();

      const products = snap.docs.map(doc => {
        const d = doc.data() as any;
        return {
          category: d.category as string | undefined,
          subcategory: d.subcategory as string | undefined,
          productType: d.productType as string | undefined,
          designThemes: d.designThemes as string[] | undefined
        };
      });

      for (const cat of featuredCategories) {
        const mapping = (featuredCategoryMappings as any)[cat.slug];
        if (!mapping) continue;

        let count = 0;

        for (const p of products) {
          let matches = true;
          if (mapping.category && p.category !== mapping.category) matches = false;
          if (mapping.subcategory && p.subcategory !== mapping.subcategory) matches = false;
          if (mapping.productType && p.productType !== mapping.productType) matches = false;

          if (mapping.designThemes && mapping.designThemes.length > 0) {
            const ok = p.designThemes?.some(t => mapping.designThemes.includes(t as any));
            if (!ok) matches = false;
          }

          if (matches) count++;
        }

        cat.count = count;
      }

      return { success: true, data: { featuredCategories } };
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : (error as Error)?.message || "Unknown error fetching featured categories";
      return { success: false, error: message, status: 500 };
    }
  }
};
