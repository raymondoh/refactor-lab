"use client";

import { Separator } from "@/components/ui/separator";
import { PriceRangeFilterWrapper } from "./PriceRangeFilterWrapper";
import { InStockFilterWrapper } from "./InStockFilterWrapper";
import { MaterialFilterWrapper } from "./MaterialFilterWrapper";
import { ColorFilterWrapper } from "./ColorFilterWrapper";
import { StickySideFilterWrapper } from "./StickySideFilterWrapper";
import { ThemeFilterWrapper } from "./ThemeFilterWrapper";
import { SaleFilterWrapper } from "./SaleFilterWrapper";
import { CategoryFilter } from "./CategoryFilter";
import { useProducts } from "../ProductsProvider";
import { AnimatedFilterSection } from "./AnimatedFilterSection";

// Define the CategoryData interface
export interface CategoryData {
  id: string;
  name: string;
  count: number;
  subcategories?: Array<{
    id: string;
    name: string;
    count: number;
  }>;
}

// Define the props interface for ProductFilters
interface ProductFiltersProps {
  selectedCategory?: string | null;
  onCategoryChange?: (categoryId: string | null) => void;
  categoriesData?: CategoryData[];
}

export function ProductFilters({ selectedCategory, onCategoryChange, categoriesData = [] }: ProductFiltersProps) {
  const { hasActiveFilters } = useProducts();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="space-y-6">
          {/* Only render CategoryFilter if we have the required props */}
          {selectedCategory !== undefined && onCategoryChange && categoriesData.length > 0 && (
            <>
              <AnimatedFilterSection title="Categories" defaultOpen={true}>
                <CategoryFilter
                  categories={categoriesData}
                  selectedCategory={selectedCategory}
                  onCategoryChange={onCategoryChange}
                />
              </AnimatedFilterSection>
              <Separator />
            </>
          )}

          <AnimatedFilterSection title="Price Range" defaultOpen={true}>
            <PriceRangeFilterWrapper />
          </AnimatedFilterSection>
          <Separator />

          <AnimatedFilterSection title="Design Themes" defaultOpen={true}>
            <ThemeFilterWrapper />
          </AnimatedFilterSection>
          <Separator />

          <AnimatedFilterSection title="Special Offers" defaultOpen={true}>
            <SaleFilterWrapper />
          </AnimatedFilterSection>
          <Separator />

          <AnimatedFilterSection title="Availability" defaultOpen={true}>
            <InStockFilterWrapper />
          </AnimatedFilterSection>
          <Separator />

          <AnimatedFilterSection title="Material" defaultOpen={true}>
            <MaterialFilterWrapper />
          </AnimatedFilterSection>
          <Separator />

          <AnimatedFilterSection title="Color" defaultOpen={true}>
            <ColorFilterWrapper />
          </AnimatedFilterSection>
          <Separator />

          <AnimatedFilterSection title="Sticky Side" defaultOpen={true}>
            <StickySideFilterWrapper />
          </AnimatedFilterSection>
        </div>
      </div>
    </div>
  );
}
