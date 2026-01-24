"use client";

import { ColorFilter } from "./ColorFilter";
import { useProducts } from "../ProductsProvider";

export function ColorFilterWrapper() {
  const { availableColors, selectedColors, toggleColor } = useProducts();

  return <ColorFilter colors={availableColors || []} selectedColors={selectedColors || []} onToggle={toggleColor} />;
}
