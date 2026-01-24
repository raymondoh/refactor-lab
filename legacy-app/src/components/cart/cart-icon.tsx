"use client";

import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { HeaderIconButton } from "@/components/header/header-icon-button";

export function CartIcon() {
  // Get itemCount and the new toggleCart function from the context
  const { itemCount, toggleCart } = useCart();

  return (
    <div className="relative">
      {/* This button will now call toggleCart from the context */}
      <HeaderIconButton onClick={toggleCart} aria-label="Open cart">
        <ShoppingBag className="h-5 w-5" />
      </HeaderIconButton>

      {itemCount > 0 && (
        <Badge variant="default" className="absolute -right-2 -top-2 h-5 w-5 justify-center rounded-full p-0 text-xs">
          {itemCount}
        </Badge>
      )}
    </div>
  );
}
