// src/components/dashboard/admin/orders/AdminOrdersClient.tsx
"use client";

import { useState, useTransition } from "react";
import { OrdersDataTable } from "./OrdersDataTable"; // Uses the refactored version
import { getAdminOrderColumns } from "./admin-order-columns";
import { fetchAllOrdersClient } from "@/actions/client";
import type { Order } from "@/types/order";

interface AdminOrdersClientProps {
  orders: Order[];
}

export function AdminOrdersClient({ orders: initialOrders }: AdminOrdersClientProps) {
  // Renamed 'orders' to 'initialOrders' for clarity
  const [data, setData] = useState<Order[]>(initialOrders);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = async () => {
    startTransition(async () => {
      try {
        const refreshedOrders = await fetchAllOrdersClient();
        // Assuming fetchAllOrdersClient returns the full list of orders
        // and Order type has an 'id' property.
        if (Array.isArray(refreshedOrders)) {
          // Basic check
          setData(refreshedOrders);
        } else if (
          typeof refreshedOrders === "object" &&
          refreshedOrders !== null &&
          "success" in refreshedOrders &&
          Array.isArray((refreshedOrders as any).data)
        ) {
          // Handle case where it might be an object like { success: true, data: [...] }
          setData((refreshedOrders as any).data);
        } else {
          console.error("Refreshed orders data is not in expected format:", refreshedOrders);
          // Potentially set an error state or show a toast
        }
      } catch (error) {
        console.error("Error refreshing orders:", error);
        // Potentially set an error state or show a toast
      }
    });
  };

  // Get the column definitions
  const columns = getAdminOrderColumns();

  return (
    // The OrdersDataTable now encapsulates the toolbar and the actual table
    <OrdersDataTable data={data} columns={columns} onRefresh={handleRefresh} isRefreshing={isPending} />
  );
}
