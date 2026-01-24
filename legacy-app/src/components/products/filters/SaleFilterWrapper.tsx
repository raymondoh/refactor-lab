"use client";

import { SaleFilter } from "./SaleFilter";
import { useProducts } from "../ProductsProvider";

export function SaleFilterWrapper() {
  const { onSaleOnly, toggleOnSale } = useProducts();

  return <SaleFilter checked={onSaleOnly} onToggle={toggleOnSale} />;
}
