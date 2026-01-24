//src/components/products/ProductCardButton.tsx
"use client";

import { useCart } from "@/contexts/CartContext";
import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Product } from "@/types/product";

interface ProductCardButtonProps {
  product: Product;
  className?: string;
}

export function ProductCardButton({ product, className }: ProductCardButtonProps) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    // Simply add the item to cart - the drawer opening will provide feedback
    addItem(product, 1);
  };

  return (
    <Button size="sm" className={`h-8 px-3 ${className || ""}`} onClick={handleAddToCart}>
      <ShoppingCart data-testid="lucide-icon" className="h-3.5 w-3.5 mr-1" />
      Add
    </Button>
  );
}
