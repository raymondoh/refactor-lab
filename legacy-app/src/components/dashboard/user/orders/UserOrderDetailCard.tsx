// src/components/dashboard/user/orders/UserOrderDetailCard.tsx
"use client";

import { useRouter } from "next/navigation";
import { formatDate } from "@/utils/date";
import { formatPrice } from "@/lib/utils"; // Import the formatPrice function
import { TAX_RATE, SHIPPING_CONFIG } from "@/config/checkout";
import type { Order } from "@/types/order";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface UserOrderDetailCardProps {
  order: Order;
}

export function UserOrderDetailCard({ order }: UserOrderDetailCardProps) {
  const router = useRouter();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // --- FIX: Recalculate subtotal, tax, and shipping based on order.items ---
  // 1. Calculate the true subtotal from the order items
  const calculatedSubtotal = order.items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  // 2. Calculate tax based on the derived subtotal
  const calculatedTax = parseFloat((calculatedSubtotal * TAX_RATE).toFixed(2));

  // 3. Calculate shipping based on the derived subtotal
  const calculatedShipping = calculatedSubtotal > SHIPPING_CONFIG.freeShippingThreshold ? 0 : SHIPPING_CONFIG.flatRate;

  // The 'order.amount' is the actual total paid to Stripe and saved in Firebase
  const totalPaid = order.amount;
  // --- END FIX ---

  const shouldShowDownload = ["processing", "shipped", "delivered"].includes(order.status);

  // Dynamic import for PDF generation - only loads when needed
  const handleDownloadReceipt = async () => {
    setIsGeneratingPdf(true);
    try {
      const { generateReceiptPdf } = await import("@/utils/generateReceiptPdf");
      await generateReceiptPdf(order);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 text-sm">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="font-medium text-muted-foreground">Date:</span>
          <span>{order.createdAt ? formatDate(order.createdAt) : "-"}</span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium text-muted-foreground">Order ID:</span>
          <span>{order.id}</span>
        </div>

        {/* --- FIX: Display the correct subtotal, tax, and shipping --- */}
        <div className="flex justify-between">
          <span className="font-medium text-muted-foreground">Subtotal:</span>
          <span>{formatPrice(calculatedSubtotal, "gbp")}</span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium text-muted-foreground">Tax ({TAX_RATE * 100}%):</span>
          <span>{formatPrice(calculatedTax, "gbp")}</span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium text-muted-foreground">Shipping:</span>
          <span>{calculatedShipping === 0 ? "Free" : formatPrice(calculatedShipping, "gbp")}</span>
        </div>
        {/* --- END FIX --- */}

        <Separator />

        {/* --- FIX: Display the true total paid from order.amount --- */}
        <div className="flex justify-between font-medium text-base">
          <span>Total Paid:</span>
          <span>{formatPrice(totalPaid, "gbp")}</span>
        </div>
        {/* --- END FIX --- */}

        <div className="flex justify-between">
          <span className="font-medium text-muted-foreground">Status:</span>
          <span className="capitalize">{order.status}</span>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-2">Items Ordered</h3>
        <ul className="list-disc ml-5 space-y-1 text-muted-foreground text-sm">
          {order.items.map((item, i) => (
            <li key={i}>
              {item.quantity} × {item.name} @ {formatPrice(item.price, "gbp")}
            </li>
          ))}
        </ul>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-2">Shipping Address</h3>
        <div className="space-y-0.5 text-muted-foreground text-sm">
          {/* Add the customer's name for clarity */}
          <p className="font-medium text-foreground">{order.customerName}</p>
          <p>{order.shippingAddress.address}</p>
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
          </p>
          <p>{order.shippingAddress.country}</p>
        </div>
      </div>

      <div className="flex justify-between pt-6 gap-4">
        <Button variant="outline" onClick={() => router.push("/user/orders")}>
          Back to Orders
        </Button>
        {shouldShowDownload && (
          <Button onClick={handleDownloadReceipt} disabled={isGeneratingPdf}>
            {isGeneratingPdf ? "Generating..." : "Download Receipt"}
          </Button>
        )}
      </div>
    </div>
  );
}
