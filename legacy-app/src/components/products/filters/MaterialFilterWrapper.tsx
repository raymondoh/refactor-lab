"use client";

import { MaterialFilter } from "./MaterialFilter";
import { useProducts } from "../ProductsProvider";

export function MaterialFilterWrapper() {
  const { availableMaterials, selectedMaterials, toggleMaterial } = useProducts();

  // Always render the filter, even if no materials are available
  return (
    <MaterialFilter
      materials={availableMaterials || []}
      selectedMaterials={selectedMaterials || []}
      onToggle={toggleMaterial}
    />
  );
}
