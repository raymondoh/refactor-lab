"use client";

import { PriceRangeFilter } from "./PriceRangeFilter";
import { useProducts } from "../ProductsProvider";

export function PriceRangeFilterWrapper() {
  // Use resetFilters instead of resetPriceFilter
  const { priceRange, currentPriceRange, updatePriceRange, resetFilters } = useProducts();

  return (
    <PriceRangeFilter
      minPrice={currentPriceRange[0]}
      maxPrice={currentPriceRange[1]}
      priceRange={priceRange}
      onPriceChange={updatePriceRange}
      onReset={resetFilters}
    />
  );
}
