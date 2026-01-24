/**
 * Category type representing a group of products with the same category
 */
export interface Category {
  /**
   * Unique identifier for the category (slug format)
   */
  id: string;

  /**
   * Display name of the category
   */
  name: string;

  /**
   * Number of products in this category
   */
  count: number;

  /**
   * Optional image URL for the category (typically from a representative product)
   */
  image?: string;

  /**
   * Optional description of the category
   */
  description?: string;

  /**
   * Whether this category is featured on the homepage or in special sections
   */
  featured?: boolean;
}

/**
 * Subcategory type representing a nested category within a parent category
 */
export interface Subcategory {
  /**
   * Unique identifier for the subcategory
   */
  id: string;

  /**
   * Display name of the subcategory
   */
  name: string;

  /**
   * ID of the parent category this subcategory belongs to
   */
  parentId: string;

  /**
   * Number of products in this subcategory
   */
  count?: number;
}
