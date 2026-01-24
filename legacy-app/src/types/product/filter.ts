// src/types/product/filter.ts

export type ProductFilterOptions = {
  category?: string;
  subcategory?: string;
  designThemes?: string[];
  productType?: string;
  material?: string;
  finish?: string;
  placements?: string[];
  priceRange?: string; // e.g. "10-20"
  isFeatured?: boolean;
  isCustomizable?: boolean;
  stickySide?: string;

  // Added filters:
  brand?: string;
  tags?: string[];
  onSale?: boolean;
  isNewArrival?: boolean;
  inStock?: boolean;
  baseColor?: string; // To explicitly filter by the base color
  query?: string; // NEW: Add a general search query string
};
