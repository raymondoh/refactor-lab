"use client";

import { useState, useCallback, useEffect } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductListItem } from "@/components/products/ProductListItem";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LayoutToggle } from "@/components/products/LayoutToggle";
import { useProducts } from "./ProductsProvider";
import { MobileFiltersButton } from "@/components/products/MobileFiltersButton";
import { ActiveFilterBadges } from "./filters/ActiveFilterBadges";
import { motion, AnimatePresence } from "framer-motion";

export function ProductsGrid() {
  const { filteredProducts, allProducts } = useProducts();
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [visibleProducts, setVisibleProducts] = useState(12);
  const [sortOrder, setSortOrder] = useState<string>("featured");
  const [isFiltering, setIsFiltering] = useState(false);

  // Simulate a filtering effect when the filtered products change
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [filteredProducts.length]);

  const handleLayoutChange = useCallback((newLayout: "grid" | "list") => {
    setLayout(newLayout);
  }, []);

  const loadMore = () => {
    setVisibleProducts(prev => prev + 12);
  };

  // Sort products based on selected sort order
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOrder) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "newest":
        // Handle different types of createdAt (Date, string, or undefined)
        if (a.createdAt instanceof Date && b.createdAt instanceof Date) {
          return b.createdAt.getTime() - a.createdAt.getTime();
        } else if (typeof a.createdAt === "string" && typeof b.createdAt === "string") {
          // If createdAt is a string (ISO date format), compare them directly
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
          // Fallback to string comparison for IDs if they're not numbers
          return String(b.id).localeCompare(String(a.id));
        }
      default:
        // Default to featured or any other sorting logic
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    }
  });

  const displayedProducts = sortedProducts.slice(0, visibleProducts);
  const hasMoreProducts = visibleProducts < sortedProducts.length;

  return (
    <div>
      {filteredProducts.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search criteria.</p>
        </motion.div>
      ) : (
        <>
          {/* Mobile filters button - only visible on mobile */}
          <div className="mb-4 lg:hidden">
            <MobileFiltersButton />
          </div>

          {/* Active filter badges */}
          <ActiveFilterBadges />

          {/* Product count and sorting options */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-muted-foreground">
              {isFiltering ? (
                <span className="inline-flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Filtering...
                </span>
              ) : (
                <motion.span
                  key={filteredProducts.length}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}>
                  {filteredProducts.length} of {allProducts.length} products
                </motion.span>
              )}
            </p>
            <div className="flex items-center space-x-3">
              <LayoutToggle onLayoutChange={handleLayoutChange} />
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">Sort by:</span>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Product grid or list based on layout */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${layout}-${sortOrder}-${filteredProducts.length}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}>
              {layout === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                  {displayedProducts.map(product => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}>
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  {displayedProducts.map(product => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}>
                      <ProductListItem product={product} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Load More Button */}
          {hasMoreProducts && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="mt-8 text-center">
              <Button onClick={loadMore} variant="outline" className="px-8">
                Load More Products
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Showing {displayedProducts.length} of {filteredProducts.length} products
              </p>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
