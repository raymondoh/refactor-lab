"use client";

import type { ShippingFormValues } from "@/schemas/ecommerce/stripe";
import { Separator } from "@/components/ui/separator";
// 1. Import the new 'formatPrice' function
import { formatPrice } from "@/lib/utils";
import { DEFAULT_CURRENCY } from "@/config/checkout";

export interface CheckoutSummaryProps {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingDetails?: ShippingFormValues;
}

export function CheckoutSummary({ subtotal, tax, shipping, total, shippingDetails }: CheckoutSummaryProps) {
  // We can now directly use DEFAULT_CURRENCY from your config file
  const currency = DEFAULT_CURRENCY;

  return (
    <div className="rounded-xl border border-input/40 p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold tracking-tight">Order Summary</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          {/* 2. Use the new formatPrice function */}
          <span>{formatPrice(subtotal, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax</span>
          <span>{formatPrice(tax, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>{shipping === 0 ? "Free" : formatPrice(shipping, currency)}</span>
        </div>
        <Separator className="my-4" />
        <div className="flex justify-between font-semibold text-base">
          <span>Total</span>
          <span>{formatPrice(total, currency)}</span>
        </div>
      </div>
    </div>
  );
}
