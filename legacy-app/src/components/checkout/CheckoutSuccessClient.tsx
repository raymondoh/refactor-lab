// src/components/checkout/CheckoutSuccessClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { CheckoutSuccess } from "./checkoutSuccess";

type ResolveResponse = { status: "ready"; orderId: string } | { status: "pending" } | { error: string };

export function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id"); // ✅ Stripe Checkout success param

  const { clearCart } = useCart();

  const clearedRef = useRef(false);

  const [orderId, setOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Clear cart once (strict mode safe)
    if (!clearedRef.current) {
      clearCart();
      clearedRef.current = true;
    }

    let cancelled = false;

    async function resolveOnce(): Promise<ResolveResponse> {
      const res = await fetch(`/api/checkout/resolve-order?session_id=${encodeURIComponent(sessionId || "")}`, {
        method: "GET"
      });

      // Try to parse JSON regardless of status
      const data = (await res.json().catch(() => ({}))) as Partial<ResolveResponse>;

      if (!res.ok) {
        return { error: typeof data?.error === "string" ? data.error : "Failed to resolve order." };
      }

      // data is either {status:"pending"} or {status:"ready", orderId}
      if (data && (data as any).status === "ready" && typeof (data as any).orderId === "string") {
        return { status: "ready", orderId: (data as any).orderId };
      }

      if (data && (data as any).status === "pending") {
        return { status: "pending" };
      }

      return { error: "Unexpected response resolving order." };
    }

    async function pollResolve() {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      // Poll for up to ~30s (15 attempts x 2s)
      const maxAttempts = 15;
      const delayMs = 2000;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (cancelled) return;

        try {
          const result = await resolveOnce();

          if (cancelled) return;

          if ("error" in result) {
            // For transient errors, you might keep polling; for now we stop.
            console.error("Resolve order error:", result.error);
            break;
          }

          if (result.status === "ready") {
            setOrderId(result.orderId);
            break;
          }

          // pending
          await new Promise(r => setTimeout(r, delayMs));
        } catch (err) {
          console.error("Error resolving order:", err);
          break;
        }
      }

      if (!cancelled) setIsLoading(false);
    }

    pollResolve();

    return () => {
      cancelled = true;
    };
  }, [clearCart, sessionId]);

  if (isLoading) {
    return (
      <div className="w-full max-w-md px-4 sm:px-6 mx-auto py-12">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg text-muted-foreground">Finalising your order...</p>
          <p className="text-sm text-muted-foreground">This can take a few seconds while we confirm payment.</p>
        </div>
      </div>
    );
  }

  // Even if orderId is null (webhook delay), show the success component.
  // Your CheckoutSuccess component can display a “check your email” message when orderId is missing.
  return <CheckoutSuccess orderId={orderId ?? undefined} />;
}
