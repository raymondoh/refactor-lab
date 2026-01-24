"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FilterBadge } from "./FilterBadge";
import { Button } from "@/components/ui/button";
import { useProducts } from "../ProductsProvider";
// 1. Import the new 'formatPrice' function
import { formatPrice } from "@/lib/utils";

export function ActiveFilterBadges() {
  const {
    priceRange,
    currentPriceRange,
    inStockOnly,
    selectedMaterials,
    selectedColors,
    selectedStickySides,
    resetFilters,
    toggleInStock,
    toggleMaterial,
    toggleColor,
    toggleStickySide,
    updatePriceRange,
    hasActiveFilters
  } = useProducts();

  if (!hasActiveFilters) {
    return null;
  }

  const isPriceFiltered = currentPriceRange[0] > priceRange[0] || currentPriceRange[1] < priceRange[1];

  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-2 mb-2">
        <AnimatePresence>
          {isPriceFiltered && (
            <FilterBadge
              key="price-filter"
              // 2. Update the function calls to use 'formatPrice' and the currency code "gbp"
              label={`Price: ${formatPrice(currentPriceRange[0], "gbp")} - ${formatPrice(currentPriceRange[1], "gbp")}`}
              onRemove={() => updatePriceRange(priceRange[0], priceRange[1])}
            />
          )}

          {inStockOnly && <FilterBadge key="in-stock-filter" label="In Stock Only" onRemove={toggleInStock} />}

          {selectedMaterials.map(material => (
            <FilterBadge
              key={`material-${material}`}
              label={`Material: ${material}`}
              onRemove={() => toggleMaterial(material)}
            />
          ))}

          {selectedColors.map(color => (
            <FilterBadge
              key={`color-${color}`}
              label={`Color: ${color.charAt(0).toUpperCase() + color.slice(1)}`}
              onRemove={() => toggleColor(color)}
            />
          ))}

          {selectedStickySides.map(side => (
            <FilterBadge key={`side-${side}`} label={`Sticky Side: ${side}`} onRemove={() => toggleStickySide(side)} />
          ))}
        </AnimatePresence>
      </div>

      {hasActiveFilters && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
          <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
            Clear All Filters
          </Button>
        </motion.div>
      )}
    </div>
  );
}
