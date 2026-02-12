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
import { AnimatedFilterSection } from "./AnimatedFilterSection";

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

interface ProductFiltersProps {
  selectedCategory?: string | null;
  onCategoryChange?: (categoryId: string | null) => void;
  categoriesData?: CategoryData[];
}

export function ProductFilters({ selectedCategory, onCategoryChange, categoriesData = [] }: ProductFiltersProps) {
  const showCategories = selectedCategory !== undefined && !!onCategoryChange && categoriesData.length > 0;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Filters</h2>

      <div className="space-y-6">
        {showCategories && (
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
  );
}
