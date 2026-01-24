//src/components/dashboard/user/orders/UserOrdersClient.tsx
"use client";

import { useEffect, useState } from "react";
import { fetchUserOrdersClient } from "@/actions/client";
import type { Order } from "@/types/order";

import { Loader } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { UserOrderCard } from "@/components/dashboard/user/orders/UserOrderCard";

export function UserOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await fetchUserOrdersClient();
        setOrders(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // inside UserOrdersClient.tsx

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader className="animate-spin h-8 w-8 text-muted-foreground" />
        <span className="ml-4 text-muted-foreground">Loading your orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-semibold mb-4">No Orders Yet</h2>
        <p className="text-muted-foreground mb-6">When you place an order, it will show up here.</p>
        <Button onClick={() => (window.location.href = "/products")}>Browse Products</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Orders</h2>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {orders.map(order => (
          <UserOrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
