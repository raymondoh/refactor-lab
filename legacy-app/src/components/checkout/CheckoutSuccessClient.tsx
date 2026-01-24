// src/components/checkout/CheckoutSuccessClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { CheckoutSuccess } from "./checkoutSuccess";
import { fetchOrderByPaymentIntentId } from "@/actions/orders"; // Import the new action
import type { Order } from "@/types/order"; // Import Order type

export function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get("payment_intent_id"); // Get payment_intent_id
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Clear cart once on mount
    clearCart();

    const fetchOrder = async () => {
      if (paymentIntentId) {
        try {
          const fetchedOrder = await fetchOrderByPaymentIntentId(paymentIntentId);
          setOrder(fetchedOrder);
        } catch (error) {
          console.error("Error fetching order details for success page:", error);
          setOrder(null); // Ensure order is null on error
        }
      }
      setIsLoading(false);
    };

    fetchOrder();
  }, [clearCart, paymentIntentId]); // Include paymentIntentId in dependencies

  if (isLoading) {
    return (
      <div className="w-full max-w-md px-4 sm:px-6 mx-auto py-12">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  // Pass the actual Firestore order.id to CheckoutSuccess for display
  return <CheckoutSuccess orderId={order?.id} />;
}
