// // src/components/dashboard/admin/orders/admin-orders-columns.tsx

// "use client";

// import { formatDate } from "@/utils/date";
// import { formatPrice } from "@/lib/utils";
// import { TAX_RATE, SHIPPING_CONFIG } from "@/config/checkout";
// import type { ColumnDef } from "@tanstack/react-table";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Eye } from "lucide-react";
// import Link from "next/link";
// import { toast } from "sonner";
// import { updateOrderStatusAction } from "@/actions/orders";
// import type { Order } from "@/types/order";

// export function getAdminOrderColumns(): ColumnDef<Order>[] {
//   return [
//     {
//       accessorKey: "id",
//       header: "Order ID",
//       cell: ({ row }) => <div className="text-xs font-mono truncate max-w-[120px]">{row.original.id}</div>
//     },
//     {
//       accessorKey: "createdAt",
//       header: "Date",
//       cell: ({ row }) => <div>{formatDate(row.original.createdAt)}</div>
//     },
//     {
//       accessorKey: "customerEmail",
//       header: "Customer Email",
//       cell: ({ row }) => <div className="truncate max-w-[180px]">{row.original.customerEmail}</div>
//     },
//     {
//       id: "total",
//       header: "Total",
//       cell: ({ row }) => {
//         const rawAmount = row.original?.amount;
//         const amount = typeof rawAmount === "number" ? rawAmount : 0;

//         const tax = parseFloat((amount * TAX_RATE).toFixed(2));
//         const shipping = amount > SHIPPING_CONFIG.freeShippingThreshold ? 0 : SHIPPING_CONFIG.flatRate;
//         const total = amount + tax + shipping;

//         return <span>{formatPrice(total, "gbp")}</span>;
//       }
//     },
//     {
//       accessorKey: "status",
//       header: "Status",
//       cell: ({ row }) => {
//         const order = row.original;
//         return (
//           <Select
//             defaultValue={order.status}
//             onValueChange={async newStatus => {
//               try {
//                 await updateOrderStatusAction(order.id, newStatus as Order["status"]);

//                 toast.success("Status updated");
//               } catch (error) {
//                 toast.error("Failed to update status");
//                 console.error("Update error:", error);
//               }
//             }}>
//             <SelectTrigger className="w-[140px]">
//               <SelectValue placeholder="Select status" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="pending">Pending</SelectItem>
//               <SelectItem value="processing">Processing</SelectItem>
//               <SelectItem value="shipped">Shipped</SelectItem>
//               <SelectItem value="delivered">Delivered</SelectItem>
//               <SelectItem value="cancelled">Cancelled</SelectItem>
//             </SelectContent>
//           </Select>
//         );
//       }
//     },
//     {
//       id: "actions",
//       header: "",
//       cell: ({ row }) => {
//         const order = row.original;
//         return (
//           <div className="flex justify-end">
//             <Link href={`/admin/orders/${order.id}`} aria-label="View order details">
//               <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition" />
//             </Link>
//           </div>
//         );
//       }
//     }
//   ];
// }
// src/components/dashboard/admin/orders/admin-orders-columns.tsx

"use client";

import { formatDate } from "@/utils/date";
import { formatPrice } from "@/lib/utils";
// Removed TAX_RATE and SHIPPING_CONFIG as they are no longer used in this file for calculation.
import type { ColumnDef } from "@tanstack/react-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/actions/orders";
import type { Order } from "@/types/order";

export function getAdminOrderColumns(): ColumnDef<Order>[] {
  return [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => <div className="text-xs font-mono truncate max-w-[120px]">{row.original.id}</div>
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => <div>{formatDate(row.original.createdAt)}</div>
    },
    {
      accessorKey: "customerEmail",
      header: "Customer Email",
      cell: ({ row }) => <div className="truncate max-w-[180px]">{row.original.customerEmail}</div>
    },
    {
      id: "total",
      header: "Total Paid", // Adjusted header to reflect it's the total amount
      cell: ({ row }) => {
        const totalPaid = row.original?.amount; // This 'amount' is already the grand total from Stripe

        // FIX: Directly display 'totalPaid' without recalculating tax and shipping,
        // as 'amount' already represents the final amount charged by Stripe.
        return <span>{formatPrice(totalPaid, "gbp")}</span>;
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <Select
            defaultValue={order.status}
            onValueChange={async newStatus => {
              try {
                await updateOrderStatusAction(order.id, newStatus as Order["status"]);

                toast.success("Status updated");
              } catch (error) {
                toast.error("Failed to update status");
                console.error("Update error:", error);
              }
            }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        );
      }
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex justify-end">
            <Link href={`/admin/orders/${order.id}`} aria-label="View order details">
              <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition" />
            </Link>
          </div>
        );
      }
    }
  ];
}
