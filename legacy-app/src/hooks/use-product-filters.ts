"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Product, ProductFilterOptions, GetAllProductsResult, GetAllProductsSuccess } from "@/types/product";
import { fetchAllProductsClient } from "@/actions/client";

// NEW: Add searchQuery to the hook's parameters
export function useProductFilters(
  initialProducts: Product[],
  currentCategory?: string,
  currentSubcategory?: string,
  searchQuery?: string // NEW: Accept searchQuery as a parameter
) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);

  // NEW: State for the internal search query, initialized from prop
  const [internalSearchQuery, setInternalSearchQuery] = useState<string | undefined>(searchQuery);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [currentPriceRange, setCurrentPriceRange] = useState<[number, number]>([0, 1000]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedStickySides, setSelectedStickySides] = useState<string[]>([]);

  // Theme and Sale filtering state
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [onSaleOnly, setOnSaleOnly] = useState<boolean>(false);

  // Effect to initialize/reset products and filters when initialProducts, category, subcategory, or searchQuery change
  useEffect(() => {
    setProducts(initialProducts);
    setInternalSearchQuery(searchQuery); // Initialize internal search query from prop

    if (initialProducts.length > 0) {
      const prices = initialProducts.map(p => p.price).filter(p => typeof p === "number");
      const min = prices.length > 0 ? Math.floor(Math.min(...prices)) : 0;
      const max = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 1000;
      setPriceRange([min, max]);
      setCurrentPriceRange([min, max]);
    } else {
      setPriceRange([0, 1000]);
      setCurrentPriceRange([0, 1000]);
    }

    // IMPORTANT: When initialProducts or search query changes, re-filter
    // This will trigger the main fetchFilteredData useEffect
    setFilteredProducts(initialProducts);
  }, [initialProducts, currentCategory, currentSubcategory, searchQuery]); // NEW: Add searchQuery to dependencies

  useEffect(() => {
    const fetchFilteredData = async () => {
      setIsLoading(true);
      const activeFilters: ProductFilterOptions = {};

      if (currentCategory) {
        activeFilters.category = currentCategory;
      }
      if (currentSubcategory) {
        activeFilters.subcategory = currentSubcategory;
      }
      // NEW: Add the search query to active filters
      if (internalSearchQuery) {
        activeFilters.query = internalSearchQuery;
      }

      const isPriceEffectivelyFiltered =
        currentPriceRange[0] !== priceRange[0] || currentPriceRange[1] !== priceRange[1];
      if (
        isPriceEffectivelyFiltered &&
        (priceRange[0] !== 0 || priceRange[1] !== 1000 || (initialProducts && initialProducts.length > 0))
      ) {
        activeFilters.priceRange = `${currentPriceRange[0]}-${currentPriceRange[1]}`;
      }

      if (inStockOnly) activeFilters.inStock = true;
      if (selectedMaterials.length > 0) activeFilters.material = selectedMaterials[0];
      if (selectedColors.length > 0) activeFilters.baseColor = selectedColors[0];
      if (selectedStickySides.length > 0) activeFilters.stickySide = selectedStickySides[0];

      // Add theme and sale filters
      if (selectedThemes.length > 0) activeFilters.designThemes = selectedThemes;
      if (onSaleOnly) activeFilters.onSale = true;

      console.log(
        "useProductFilters - fetchFilteredData: activeFilters being sent:",
        JSON.stringify(activeFilters, null, 2)
      );

      try {
        const result: GetAllProductsResult = await fetchAllProductsClient(activeFilters);
        console.log("useProductFilters - fetchFilteredData: Result from fetchAllProductsClient:", result);

        if (result.success) {
          const successResult = result as GetAllProductsSuccess;
          setFilteredProducts(successResult.data);
          if (successResult.data.length === 0) {
            console.log(
              "useProductFilters - fetchFilteredData: WARNING - fetchAllProductsClient returned 0 products with active filters."
            );
          }
        } else {
          setFilteredProducts([]);
          console.error("useProductFilters - fetchFilteredData: Failed to fetch filtered products:", result.error);
        }
      } catch (error) {
        setFilteredProducts([]);
        console.error("useProductFilters - fetchFilteredData: Exception when fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // NEW: canFetch logic also considers internalSearchQuery
    const canFetch = initialProducts || currentCategory || currentSubcategory || internalSearchQuery;

    if (canFetch) {
      fetchFilteredData();
    } else {
      setFilteredProducts([]);
      setIsLoading(false);
    }
  }, [
    currentPriceRange,
    inStockOnly,
    selectedMaterials,
    selectedColors,
    selectedStickySides,
    selectedThemes,
    onSaleOnly,
    currentCategory,
    currentSubcategory,
    initialProducts,
    priceRange,
    internalSearchQuery // NEW: Add internalSearchQuery to dependencies
  ]);

  // Existing callbacks
  const updatePriceRange = useCallback((min: number, max: number) => {
    setCurrentPriceRange([min, max]);
  }, []);

  const toggleInStock = useCallback(() => setInStockOnly(prev => !prev), []);

  const toggleMaterial = useCallback((material: string) => {
    setSelectedMaterials(prev => (prev.includes(material) ? prev.filter(m => m !== material) : [material]));
  }, []);

  const toggleColor = useCallback((color: string) => {
    setSelectedColors(prev => (prev.includes(color) ? prev.filter(c => c !== color) : [color.toLowerCase()]));
  }, []);

  const toggleStickySide = useCallback((side: string) => {
    setSelectedStickySides(prev => (prev.includes(side) ? prev.filter(s => s !== side) : [side]));
  }, []);

  // Theme and Sale callbacks
  const toggleTheme = useCallback((theme: string) => {
    setSelectedThemes(prev => (prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme]));
  }, []);

  const toggleOnSale = useCallback(() => setOnSaleOnly(prev => !prev), []);

  const resetFilters = useCallback(() => {
    setCurrentPriceRange(priceRange);
    setInStockOnly(false);
    setSelectedMaterials([]);
    setSelectedColors([]);
    setSelectedStickySides([]);
    setSelectedThemes([]);
    setOnSaleOnly(false);
    setInternalSearchQuery(undefined); // NEW: Reset the search query
  }, [priceRange]);

  // Existing available options - these depend on initialProducts, which can now be pre-filtered by search query
  const availableMaterials = useMemo(
    () =>
      initialProducts && initialProducts.length > 0
        ? [...new Set(initialProducts.map(p => p.material).filter(Boolean) as string[])].sort()
        : [],
    [initialProducts]
  );

  const availableColors = useMemo(
    () =>
      initialProducts && initialProducts.length > 0
        ? [
            ...new Set(
              initialProducts
                .map(p => p.baseColor || p.color || "")
                .filter(Boolean)
                .map(c => c.toLowerCase())
            )
          ].sort()
        : [],
    [initialProducts]
  );

  const availableStickySides = useMemo(
    () =>
      initialProducts && initialProducts.length > 0
        ? [...new Set(initialProducts.map(p => p.stickySide).filter(Boolean) as string[])].sort()
        : [],
    [initialProducts]
  );

  // Available themes from products
  const availableThemes = useMemo(() => {
    if (!initialProducts || initialProducts.length === 0) return [];

    const allThemes = initialProducts
      .filter(p => p.designThemes && Array.isArray(p.designThemes))
      .flatMap(p => p.designThemes as string[])
      .filter(Boolean);

    return [...new Set(allThemes)].sort();
  }, [initialProducts]);

  const isPriceEffectivelyFiltered = currentPriceRange[0] !== priceRange[0] || currentPriceRange[1] !== priceRange[1];
  const hasActiveUiFilters =
    isPriceEffectivelyFiltered ||
    inStockOnly ||
    selectedMaterials.length > 0 ||
    selectedColors.length > 0 ||
    selectedStickySides.length > 0 ||
    selectedThemes.length > 0 ||
    onSaleOnly ||
    internalSearchQuery; // NEW: Include internalSearchQuery

  // NEW: Add a function to set the search query externally (e.g., from search bar input)
  const setExternalSearchQuery = useCallback((query: string | undefined) => {
    setInternalSearchQuery(query);
  }, []);

  return {
    allProducts: products,
    filteredProducts,
    priceRange,
    currentPriceRange,
    inStockOnly,
    selectedMaterials,
    availableMaterials,
    selectedColors,
    availableColors,
    selectedStickySides,
    availableStickySides,
    // Theme and Sale exports
    selectedThemes,
    availableThemes,
    onSaleOnly,
    updatePriceRange,
    toggleInStock,
    toggleMaterial,
    toggleColor,
    toggleStickySide,
    toggleTheme,
    toggleOnSale,
    resetFilters,
    hasActiveFilters: hasActiveUiFilters,
    isLoading,
    // NEW: Expose searchQuery and its setter
    searchQuery: internalSearchQuery,
    setSearchQuery: setExternalSearchQuery
  };
}
