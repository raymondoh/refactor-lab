// src/components/cart/checkout-button.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ShoppingCart, Lock } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";

export function CheckoutButton() {
  const { items, closeCart } = useCart();
  const { status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthenticated = status === "authenticated";

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.info("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        items: items.map(i => ({
          id: i.product.id,
          quantity: i.quantity
        }))
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        toast.error(data?.error || "Failed to start checkout.");
        return;
      }

      closeCart();
      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Checkout failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button onClick={handleCheckout} disabled={isSubmitting || items.length === 0} className="w-full">
      {isSubmitting ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Redirecting…
        </>
      ) : (
        <>
          {!isAuthenticated ? <Lock className="mr-2 h-4 w-4" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
          {!isAuthenticated ? "Checkout as Guest" : "Proceed to Checkout"}
        </>
      )}
    </Button>
  );
}
