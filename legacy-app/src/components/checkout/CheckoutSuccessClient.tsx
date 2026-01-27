// src/components/checkout/CheckoutSuccessClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { CheckoutSuccess } from "./checkoutSuccess";
import { fetchOrderByPaymentIntentId } from "@/actions/orders";
import type { Order } from "@/types/order";

export function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get("payment_intent_id");

  const { clearCart } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    clearCart();

    const fetchOrder = async () => {
      if (!paymentIntentId) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await fetchOrderByPaymentIntentId(paymentIntentId);

        if (!result.success) {
          console.error("Failed to fetch order:", result.error);
          setOrder(null);
        } else {
          setOrder(result.order ?? null);
        }
      } catch (error) {
        console.error("Error fetching order details for success page:", error);
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [clearCart, paymentIntentId]);

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

  return <CheckoutSuccess orderId={order?.id} />;
}
