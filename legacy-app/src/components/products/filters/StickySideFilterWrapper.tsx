"use client";

import { StickySideFilter } from "./StickySideFilter";
import { useProducts } from "../ProductsProvider";

export function StickySideFilterWrapper() {
  const { availableStickySides, selectedStickySides, toggleStickySide } = useProducts();

  return (
    <StickySideFilter
      sides={availableStickySides || []}
      selectedSides={selectedStickySides || []}
      onToggle={toggleStickySide}
    />
  );
}
