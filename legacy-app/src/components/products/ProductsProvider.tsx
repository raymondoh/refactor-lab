// src/components/products/ProductsProvider.tsx
"use client";

import React, { createContext, useContext } from "react";
import { useProductFilters } from "@/hooks/use-product-filters";
import type { Product } from "@/types/product";

// Define props for ProductsProvider
interface ProductsProviderProps {
  children: React.ReactNode;
  initialProducts: Product[];
  currentCategory?: string;
  currentSubcategory?: string;
  searchQuery?: string; // NEW: Add searchQuery to props interface
}

// Create context with a more specific type
// Use ReturnType<typeof useProductFilters> for the context value type
type ProductFiltersContextType = ReturnType<typeof useProductFilters>;
export const ProductsContext = createContext<ProductFiltersContextType | undefined>(undefined);

export const ProductsProvider: React.FC<ProductsProviderProps> = ({
  children,
  initialProducts,
  currentCategory,
  currentSubcategory,
  searchQuery // NEW: Destructure searchQuery
}) => {
  // Pass category, subcategory, AND searchQuery to the hook
  const filterState = useProductFilters(initialProducts, currentCategory, currentSubcategory, searchQuery); // NEW: Pass searchQuery

  return <ProductsContext.Provider value={filterState}>{children}</ProductsContext.Provider>;
};

// Custom hook to use the context, ensures context is not undefined
export const useProducts = (): ProductFiltersContextType => {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductsProvider");
  }
  return context;
};
