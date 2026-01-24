"use client";

import { InStockFilter } from "./InStockFilter";
import { useProducts } from "../ProductsProvider";

export function InStockFilterWrapper() {
  const { inStockOnly, toggleInStock } = useProducts();

  return <InStockFilter checked={inStockOnly} onToggle={toggleInStock} />;
}
