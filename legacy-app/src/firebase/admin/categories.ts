//src/firebase/admin/categories.ts
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

// Define the return type for getCategories
export interface GetCategoriesResult {
  success: boolean;
  data?: Category[];
  error?: string;
}

// ===================
// GET ALL CATEGORIES
// ===================
export async function getCategories(): Promise<GetCategoriesResult> {
  try {
    // Create category objects using predefined categories from config
    const categoryData: Category[] = categories.map(category => {
      // Define the id once to reuse it
      const id = category.toLowerCase().replace(/\s+/g, "-");

      return {
        id: id,
        name: category,
        count: 0, // Placeholder
        image: getCategoryImage(category),
        icon: id // <<< FIX: Add this line to set the icon property
      };
    });

    console.log(`getCategories - Returning ${categoryData.length} categories with icons`);

    return { success: true, data: categoryData };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error fetching categories";
    return { success: false, error: message };
  }
}

// ===================
// GET ALL CATEGORY IMAGE
// ===================
// Helper function used above to get predefined category images
// You can customize these paths based on your actual image assets
function getCategoryImage(category: string): string | undefined {
  const categoryImages: Record<string, string> = {
    Cars: "/images/categories/cars.jpg",
    Motorbikes: "/images/categories/motorbikes.jpg",
    EVs: "/images/categories/evs.jpg",
    Trucks: "/images/categories/trucks.jpg",
    Boats: "/images/categories/boats.jpg",
    Planes: "/images/categories/planes.jpg"
    // Add more categories as needed
  };

  return categoryImages[category];
}

// ===================
// GET ALL CATEGORIES WITH COUNT
// ===================
// Alternative: If you want to keep some dynamic behavior but make it more efficient,
// you could create a hybrid approach that only fetches category counts without full product data:

export async function getCategoriesWithCounts(): Promise<GetCategoriesResult> {
  try {
    const db = getAdminFirestore();
    // This is more efficient than fetching all product data
    // We only get the category field from each document
    const snapshot = await db.collection("products").select("category").get();

    // Calculate counts efficiently
    const categoryCounts: Record<string, number> = {};
    snapshot.docs.forEach(doc => {
      const category = doc.data().category;
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });

    // Create category objects with real counts but predefined images
    const categoryData: Category[] = categories.map(category => ({
      id: category.toLowerCase().replace(/\s+/g, "-"),
      name: category,
      count: categoryCounts[category] || 0,
      image: getCategoryImage(category)
    }));

    console.log(`getCategoriesWithCounts - Returning ${categoryData.length} categories with efficient counting`);

    return { success: true, data: categoryData };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error fetching categories";
    return { success: false, error: message };
  }
}

// ===================
// GET SUBCATEGORIES FOR A CATEGORY
// ===================

export async function getSubcategories(categoryParam: string): Promise<{
  success: boolean;
  data?: string[]; // Array of subcategory display names
  error?: string;
}> {
  try {
    const normalizedParentCategoryName = normalizeCategory(categoryParam); // From src/config/categories.ts

    if (!normalizedParentCategoryName) {
      // If normalizeCategory returns undefined, the categoryParam was not a valid slug/name
      return { success: true, data: [] }; // Or success: false, error: "Invalid parent category"
    }

    // Check if the normalized category exists in our predefined subcategories
    // Note: subcategories keys are 'Cars', 'Motorbikes' etc.
    const subcategoryList = subcategories[normalizedParentCategoryName as keyof typeof subcategories];

    if (subcategoryList) {
      return {
        success: true,
        data: subcategoryList
      };
    }

    return { success: true, data: [] }; // No subcategories defined for this valid category
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error fetching subcategories";
    return { success: false, error: message };
  }
}

// ===================
// GET AVAILABLE DESIGN THEMES
// ===================
export async function getDesignThemes(): Promise<{
  success: boolean;
  data?: string[];
  error?: string;
}> {
  try {
    // Return predefined design themes
    return { success: true, data: [...designThemes] };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error fetching design themes";
    return { success: false, error: message };
  }
}

// ===================
// GET AVAILABLE PRODUCT TYPES
// ===================
export async function getProductTypes(): Promise<{
  success: boolean;
  data?: string[];
  error?: string;
}> {
  try {
    // Return predefined product types
    return { success: true, data: [...productTypes] };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error fetching product types";
    return { success: false, error: message };
  }
}

// ===================
// GET AVAILABLE MATERIALS
// ===================
export async function getMaterials(): Promise<{
  success: boolean;
  data?: string[];
  error?: string;
}> {
  try {
    // Return predefined materials
    return { success: true, data: [...materials] };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error fetching materials";
    return { success: false, error: message };
  }
}

// ===================
// GET AVAILABLE PLACEMENTS
// ===================
export async function getPlacements(): Promise<{
  success: boolean;
  data?: string[];
  error?: string;
}> {
  try {
    // Return predefined placements
    return { success: true, data: [...placements] };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error fetching placements";
    return { success: false, error: message };
  }
}

// ===================
// GET FEATURED CATEGORIES FOR HOMEPAGE
// ===================
export async function getFeaturedCategories() {
  try {
    const featuredCategories = [
      {
        name: "Sport Bike Decals",
        image: "/bike.jpg",
        slug: "sport-bike",
        count: 0
      },
      {
        name: "Cruiser Graphics",
        image: "/car.jpg",
        slug: "cruiser",
        count: 0
      },
      {
        name: "Off-Road Stickers",
        image: "/bike.jpg",
        slug: "off-road",
        count: 0
      },
      {
        name: "Custom Designs",
        image: "/car.jpg",
        slug: "custom",
        count: 0
      },
      {
        name: "Vintage Collection",
        image: "/car.jpg",
        slug: "vintage",
        count: 0
      }
    ];

    // Calculate counts for each featured category
    const db = getAdminFirestore();
    const snapshot = await db.collection("products").get();

    // Use a more specific type for the products
    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        category: data.category as string | undefined,
        subcategory: data.subcategory as string | undefined,
        productType: data.productType as string | undefined,
        designThemes: data.designThemes as string[] | undefined
      };
    });

    // Update counts based on the featuredCategoryMappings
    for (const category of featuredCategories) {
      const mapping = featuredCategoryMappings[category.slug];
      if (mapping) {
        let count = 0;

        for (const product of products) {
          let matches = true;

          if (mapping.category && product.category !== mapping.category) {
            matches = false;
          }

          if (mapping.subcategory && product.subcategory !== mapping.subcategory) {
            matches = false;
          }

          if (mapping.productType && product.productType !== mapping.productType) {
            matches = false;
          }

          if (mapping.designThemes && mapping.designThemes.length > 0) {
            const hasMatchingTheme = product.designThemes?.some(theme => mapping.designThemes?.includes(theme as any));
            if (!hasMatchingTheme) {
              matches = false;
            }
          }

          if (matches) {
            count++;
          }
        }

        category.count = count;
      }
    }

    return { success: true as const, data: featuredCategories };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : (error as Error)?.message || "Unknown error fetching featured categories";
    return { success: false as const, error: message };
  }
}
