"use client";

import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/product";

interface ProductActionsProps {
  product: Product; // Replace with your product type
}

export function ProductActions({ product }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const decreaseQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const handleAddToCart = () => {
    addItem(product, quantity);
    setIsAdded(true);

    // Reset the button after 1.5 seconds
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Quantity:</span>
        <div className="flex items-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-r-none"
            onClick={decreaseQuantity}
            disabled={quantity <= 1}>
            <Minus className="h-3 w-3" />
            <span className="sr-only">Decrease quantity</span>
          </Button>
          <div className="flex h-8 w-12 items-center justify-center border-y border-input bg-background">
            <span className="text-sm">{quantity}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-l-none"
            onClick={increaseQuantity}>
            <Plus className="h-3 w-3" />
            <span className="sr-only">Increase quantity</span>
          </Button>
        </div>
      </div>

      <Button onClick={handleAddToCart} className="w-full" size="lg" disabled={isAdded}>
        {isAdded ? (
          <>
            <Check className="mr-2 h-4 w-4" /> Added to Cart
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
          </>
        )}
      </Button>
    </>
  );
}
