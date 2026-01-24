"use client";

import { ThemeFilter } from "./ThemeFilter";
import { useProducts } from "../ProductsProvider";

export function ThemeFilterWrapper() {
  const { availableThemes, selectedThemes, toggleTheme } = useProducts();

  // Always render the filter, even if no themes are available
  return <ThemeFilter themes={availableThemes || []} selectedThemes={selectedThemes || []} onToggle={toggleTheme} />;
}
