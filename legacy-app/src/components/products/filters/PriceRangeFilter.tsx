"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
// 1. Import the new 'formatPrice' function
import { formatPrice } from "@/lib/utils";

interface PriceRangeFilterProps {
  minPrice: number;
  maxPrice: number;
  priceRange: [number, number];
  onPriceChange: (min: number, max: number) => void;
  onReset: () => void;
}

export function PriceRangeFilter({ minPrice, maxPrice, priceRange, onPriceChange, onReset }: PriceRangeFilterProps) {
  // Use local state to avoid direct binding to the slider
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([minPrice, maxPrice]);

  // Update local state when props change
  useEffect(() => {
    setLocalPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    const [min, max] = value as [number, number];
    setLocalPriceRange([min, max]);
  };

  // Only update parent state when slider is released
  const handleSliderCommit = () => {
    onPriceChange(localPriceRange[0], localPriceRange[1]);
  };

  const isPriceFiltered = minPrice > priceRange[0] || maxPrice < priceRange[1];

  return (
    <div className="space-y-4">
      <div>
        <Slider
          min={priceRange[0]}
          max={priceRange[1]}
          step={1}
          value={localPriceRange}
          onValueChange={handleSliderChange}
          onValueCommit={handleSliderCommit}
          className="mb-6"
        />
        <div className="flex items-center justify-between">
          {/* 2. Update the function calls to use 'formatPrice' and the currency code "gbp" */}
          <span className="text-sm">{formatPrice(localPriceRange[0], "gbp")}</span>
          <span className="text-sm">{formatPrice(localPriceRange[1], "gbp")}</span>
        </div>
      </div>

      {isPriceFiltered && (
        <Button size="sm" variant="outline" onClick={onReset} className="w-full text-xs">
          Reset Price Filter
        </Button>
      )}
    </div>
  );
}
