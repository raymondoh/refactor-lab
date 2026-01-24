// src/components/dashboard/user/orders/UserOrdersCard.tsx
"use client";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/utils/date";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types/order";
import { TAX_RATE, SHIPPING_CONFIG } from "@/config/checkout"; // Ensure these are imported

interface UserOrderCardProps {
  order: Order;
}

export function UserOrderCard({ order }: UserOrderCardProps) {
  // 1. Calculate subtotal from the items in the order
  const calculatedSubtotal = order.items.reduce((sum, item) => {
    // Use the price stored with the item in the order, which should be accurate
    return sum + item.price * item.quantity;
  }, 0);

  // 2. Calculate tax based on the derived subtotal
  const calculatedTax = parseFloat((calculatedSubtotal * TAX_RATE).toFixed(2));

  // 3. Calculate shipping based on the derived subtotal
  const calculatedShipping = calculatedSubtotal > SHIPPING_CONFIG.freeShippingThreshold ? 0 : SHIPPING_CONFIG.flatRate;

  // The 'order.amount' is the actual total paid to Stripe and saved in Firebase
  const totalPaid = order.amount;

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="text-base">Order #{order.id.slice(0, 8).toUpperCase()}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>Date:</span>
          <span>{order.createdAt ? formatDate(order.createdAt) : "-"}</span>
        </div>

        {/* Display the breakdown of subtotal, tax, and shipping */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{formatPrice(calculatedSubtotal, "gbp")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax ({TAX_RATE * 100}%):</span>
            <span>{formatPrice(calculatedTax, "gbp")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping:</span>
            <span>{formatPrice(calculatedShipping, "gbp")}</span>
          </div>
        </div>

        <Separator className="my-2" />

        {/* Display the true total paid from the order object */}
        <div className="flex justify-between text-base font-semibold">
          <span>Total Paid:</span>
          <span>{formatPrice(totalPaid, "gbp")}</span>
        </div>

        <div>
          <h3 className="font-semibold text-sm">Items</h3>
          <ul className="list-disc ml-4 mt-1 space-y-1 text-muted-foreground text-sm">
            {order.items.map((item, i) => (
              <li key={i}>
                {item.quantity} × {item.name} @ {formatPrice(item.price, "gbp")}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <Separator className="my-2" />

      <CardFooter className="flex justify-between items-center">
        <Badge variant="outline" className="text-xs capitalize">
          {order.status}
        </Badge>

        <Link href={`/user/orders/${order.id}`}>
          <span className="text-sm font-medium text-primary hover:underline">View Details</span>
        </Link>
      </CardFooter>
    </Card>
  );
}
