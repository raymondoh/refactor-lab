// src/components/dashboard/admin/orders/AdminOrdersClient.tsx
"use client";

import { useState, useTransition } from "react";
import { OrdersDataTable } from "./OrdersDataTable";
import { getAdminOrderColumns } from "./admin-order-columns";
import { fetchAllOrdersClient } from "@/actions/client";
import type { Order } from "@/types/order";

interface AdminOrdersClientProps {
  orders: Order[];
}

type OrdersResponseObject = {
  success: boolean;
  data: Order[];
};

function isOrdersResponseObject(value: unknown): value is OrdersResponseObject {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "data" in value &&
    Array.isArray((value as { data: unknown }).data)
  );
}

export function AdminOrdersClient({ orders: initialOrders }: AdminOrdersClientProps) {
  const [data, setData] = useState<Order[]>(initialOrders);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = async () => {
    startTransition(async () => {
      try {
        const refreshedOrders = await fetchAllOrdersClient();

        if (Array.isArray(refreshedOrders)) {
          // Case 1: function returns Order[]
          setData(refreshedOrders);
        } else if (isOrdersResponseObject(refreshedOrders)) {
          // Case 2: function returns { success, data }
          setData((refreshedOrders as OrdersResponseObject).data);
        } else {
          console.error("Refreshed orders data is not in expected format:", refreshedOrders);
        }
      } catch (error: unknown) {
        console.error("Error refreshing orders:", error);
      }
    });
  };

  const columns = getAdminOrderColumns();

  return <OrdersDataTable data={data} columns={columns} onRefresh={handleRefresh} isRefreshing={isPending} />;
}
