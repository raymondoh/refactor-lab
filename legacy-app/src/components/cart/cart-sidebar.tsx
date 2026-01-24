"use client";

import { useCart } from "@/contexts/CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CartItemCard } from "./cart-item-card";
import { CheckoutSummary } from "../checkout/checkout-summary";
import { CheckoutButton } from "./checkout-button";
import Link from "next/link";
import { Button } from "../ui/button";
import { Trash2, ShoppingBag } from "lucide-react"; // Import icons for buttons

// 1. Import your new configuration
import { TAX_RATE, SHIPPING_CONFIG } from "@/config/checkout";

export function CartSidebar() {
  const { items, subtotal, itemCount, isOpen, closeCart, clearCart } = useCart();

  // 2. Use the imported config for calculations
  const tax = subtotal * TAX_RATE;
  const shipping = subtotal > SHIPPING_CONFIG.freeShippingThreshold ? 0 : SHIPPING_CONFIG.flatRate;
  const total = subtotal + tax + shipping;

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Your Cart ({itemCount})</SheetTitle>
        </SheetHeader>

        {items.length > 0 ? (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto pr-4 -mr-4">
              <div className="flex flex-col gap-4">
                {items.map(item => (
                  <CartItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
            <div className="mt-auto border-t pt-4">
              {/* 3. Add the "Continue Shopping" and "Clear Cart" buttons */}
              <div className="flex justify-between items-center text-sm mb-4">
                <Button variant="ghost" className="text-muted-foreground" onClick={closeCart} asChild>
                  <Link href="/products">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Continue Shopping
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={clearCart}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Cart
                </Button>
              </div>

              {/* The items prop is no longer needed here */}
              <CheckoutSummary subtotal={subtotal} tax={tax} shipping={shipping} total={total} />
              <div className="mt-4">
                <CheckoutButton />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground mb-4">Your cart is empty.</p>
            <Button asChild onClick={closeCart}>
              <Link href="/products">Start Shopping</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
