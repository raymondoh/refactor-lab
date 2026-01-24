"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { CategoryData } from "./ProductFilters";

interface CategoryFilterProps {
  categories: CategoryData[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) {
  if (!categories || categories.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium mb-3">Categories</h3>
        <p className="text-sm text-muted-foreground">No categories available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium mb-3">Categories</h3>
      <ScrollArea className="h-[200px] pr-3">
        <div className="space-y-1">
          <Button
            variant={selectedCategory === null ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            onClick={() => onCategoryChange(null)}>
            All Categories
            <Badge variant="secondary" className="ml-auto">
              {categories.reduce((total, cat) => total + cat.count, 0)}
            </Badge>
          </Button>

          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => onCategoryChange(category.id)}>
              {category.name}
              <Badge variant="secondary" className="ml-auto">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
