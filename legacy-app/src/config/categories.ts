//src/config/categories.ts

// Define the base category names as string literals
export const categories = ["Cars", "Motorbikes", "Bicycles", "EVs", "Other"] as const;

// CategoryName is a string literal type (for type checking)
export type Category = (typeof categories)[number];

// CategoryData is the full interface with all properties
export interface CategoryData {
  id: string;
  name: string;
  count: number;
  image?: string;
  icon?: string;
}

// Define subcategories with expanded options
export const subcategories: Record<Category, string[]> = {
  Cars: ["Sports Cars", "Luxury Cars", "SUVs", "Off-road / 4x4", "Classic Cars", "Compact"],
  Motorbikes: ["Sport Bikes", "Cruisers", "Custom", "Dirt Bikes", "Touring/Adventure"],
  Bicycles: ["Mountain Bikes", "Road Bikes", "BMX", "Cruiser Bikes", "Hybrid/Commuter"],
  EVs: ["Electric Cars", "Electric Bikes", "Electric Scooters", "Electric Skateboards"],
  Other: ["Vans", "Trucks", "Scooters", "ATVs", "Watercraft"]
};

// Design themes that can apply across categories
export const designThemes = [
  "Vintage",
  "Racing",
  "Motorsport",
  "Minimalist",
  "Custom",
  "Off-Road",
  "Funny/Quotes",
  "Tribal",
  "Flames",
  "Patriotic",
  "JDM",
  "Graffiti/Urban",
  "Skulls",
  "Animals/Nature",
  "Geometric/Abstract",
  "Character/Cartoon"
] as const;

export type DesignTheme = (typeof designThemes)[number];

// Product types
export const productTypes = [
  "Decals",
  "Graphics Kits",
  "Stickers",
  "Wraps",
  "Protective Films",
  "Custom Designs"
] as const;

export type ProductType = (typeof productTypes)[number];

// Materials and finishes
export const materials = ["Vinyl", "Reflective", "Matte", "Gloss", "Holographic", "Weatherproof"] as const;

export type Material = (typeof materials)[number];

// Placement locations
export const placements = [
  "Bumper",
  "Window",
  "Body Panel",
  "Fuel Cap",
  "Wheel/Rim",
  "Helmet",
  "Fairing",
  "Tank"
] as const;

export type Placement = (typeof placements)[number];

// Brands specific to vehicle stickers and decals
export const brands = [
  "3M",
  "Avery",
  "VViViD",
  "Oracal",
  "StickerBomb",
  "RaceGraphics",
  "MotoDecal",
  "BikeStickers",
  "CarGraphix",
  "CustomDecals"
] as const;

export type Brand = (typeof brands)[number];

// Sizes for vehicle stickers
export const sizes = [
  'Small (2-4")',
  'Medium (5-8")',
  'Large (9-12")',
  'X-Large (13-18")',
  "Full Panel",
  "Full Vehicle",
  "Custom Size"
] as const;

export type Size = (typeof sizes)[number];

// Shipping Classes
export const shippingClasses = ["Standard", "Express", "International", "Free", "Flat Rate", "Bulk Order"] as const;

export type ShippingClass = (typeof shippingClasses)[number];

// Tags for vehicle stickers
export const tags = [
  "Bestseller",
  "New Design",
  "Limited Edition",
  "Waterproof",
  "UV Resistant",
  "Removable",
  "Permanent",
  "High Visibility",
  "Reflective",
  "Custom Cut",
  "Die Cut",
  "Premium",
  "Racing",
  "Motorsport",
  "Off-Road",
  "Street",
  "Track Day",
  "Show Car",
  "Restoration"
] as const;

export type Tag = (typeof tags)[number];

// Helper function to convert a Category to CategoryData
export function categoryToData(categoryName: Category): CategoryData {
  const id = categoryName.toLowerCase().replace(/\s+/g, "-");
  return {
    id,
    name: categoryName,
    count: 0, // Default count, update if you have actual counts
    icon: id // Set the icon property to the category ID
  };
}

// Helper function to convert an array of Categories to CategoryData[]
export function categoriesToData(categoryNames: Category[]): CategoryData[] {
  return categoryNames.map(categoryToData);
}

// Featured category mappings for homepage sections
export const featuredCategoryMappings: Record<
  string,
  {
    category?: Category;
    subcategory?: string;
    designThemes?: DesignTheme[];
    productType?: ProductType;
    tags?: Tag[];
    brand?: Brand;
  }
> = {
  "sport-bike": {
    category: "Motorbikes",
    subcategory: "Sport Bikes",
    productType: "Decals"
  },
  cruiser: {
    category: "Motorbikes",
    subcategory: "Cruisers",
    productType: "Graphics Kits"
  },
  "off-road": {
    designThemes: ["Off-Road"]
    // No category specified - shows off-road items across all vehicle types
  },
  custom: {
    productType: "Custom Designs"
  },
  vintage: {
    designThemes: ["Vintage"]
  }
};
// src/config/categories.ts
// Keep all your existing code, and add these new functions:

// URL parameter to database value mappings
export function normalizeCategory(categoryParam: string | undefined): Category | undefined {
  if (!categoryParam) return undefined;

  // Convert to lowercase for case-insensitive comparison
  const lowercaseParam = categoryParam.toLowerCase();

  // Find the matching category (case-insensitive)
  const matchedCategory = categories.find(category => category.toLowerCase() === lowercaseParam);

  // Special case for "EVs" which might come as "evs"
  if (lowercaseParam === "evs") return "EVs";

  return matchedCategory;
}

export function normalizeSubcategory(subcategoryParam: string | undefined, category?: Category): string | undefined {
  if (!subcategoryParam) return undefined;
  if (!category) return undefined;

  // Convert kebab-case to lowercase for comparison
  const normalizedParam = subcategoryParam.toLowerCase();

  // Get the subcategories for this category
  const categorySubcategories = subcategories[category] || [];

  // Find the matching subcategory (case-insensitive)
  const matchedSubcategory = categorySubcategories.find(
    subcategory => subcategory.toLowerCase().replace(/\s+/g, "-") === normalizedParam
  );

  return matchedSubcategory;
}
