"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingCart, Lock } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";

export function CheckoutButton() {
  const { items, closeCart } = useCart();
  const { status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === "authenticated";
  const isSessionLoading = status === "loading";

  const handleCheckout = () => {
    // If user is not authenticated, show a toast, close the cart, then redirect.
    if (!isAuthenticated) {
      // Add the toast notification right here
      toast.error("You must be logged in to make a purchase.");

      closeCart();
      router.push("/login?callbackUrl=/cart");
      return;
    }

    if (items.length === 0) {
      toast.info("Your cart is empty.");
      return;
    }

    closeCart();
    router.push("/checkout");
  };

  return (
    <Button onClick={handleCheckout} disabled={isSessionLoading || items.length === 0} className="w-full">
      {!isAuthenticated ? (
        <Lock className="mr-2 h-4 w-4" />
      ) : (
        <ShoppingCart className="mr-2 h-4 w-4" />
      )}

      {isSessionLoading ? "Loading..." : !isAuthenticated ? "Login to Continue" : "Proceed to Checkout"}
    </Button>
  );
}
