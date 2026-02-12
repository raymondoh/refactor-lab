"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { CategoryData } from "./ProductFilters";
import { cn } from "@/lib/utils";

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

  const totalCount = categories.reduce((total, cat) => total + cat.count, 0);

  const badgeBase = "ml-auto";
  const badgeActive = "bg-primary/15 text-foreground"; // token-based, works in both modes

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium mb-3">Categories</h3>

      <ScrollArea className="h-[200px] pr-3">
        <div className="space-y-1">
          {/* Reset */}
          <Button
            variant={selectedCategory === null ? "default" : "ghost"}
            size="sm"
            className="w-full justify-start"
            onClick={() => onCategoryChange(null)}>
            All Categories
            <Badge variant="secondary" className={cn(badgeBase, selectedCategory === null && badgeActive)}>
              {totalCount}
            </Badge>
          </Button>

          {/* Categories */}
          {categories.map(category => {
            const isActive = selectedCategory === category.id;

            return (
              <Button
                key={category.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => onCategoryChange(category.id)}>
                {category.name}
                <Badge variant="secondary" className={cn(badgeBase, isActive && badgeActive)}>
                  {category.count}
                </Badge>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
